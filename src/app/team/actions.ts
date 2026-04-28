"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, is_admin")
    .eq("user_id", user.id)
    .single();
  if (!profile) throw new Error("Not a team member");
  if (!profile.is_admin) throw new Error("Admin only");
  return user;
}

export async function inviteMember(email: string) {
  await requireAdmin();
  const cleaned = email.trim().toLowerCase();
  if (!cleaned || !cleaned.includes("@")) {
    return { error: "Invalid email" };
  }

  const admin = createAdminClient();

  const { error: insertError } = await admin
    .from("allowed_emails")
    .insert({ email: cleaned });
  if (insertError && !insertError.message.includes("duplicate")) {
    return { error: insertError.message };
  }

  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://hcsdashboard.vercel.app"}/auth/callback`;
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    cleaned,
    { redirectTo }
  );
  if (inviteError && !inviteError.message.toLowerCase().includes("already")) {
    return { error: inviteError.message };
  }

  revalidatePath("/team");
  return { ok: true };
}

export async function removeMember(email: string) {
  await requireAdmin();
  const cleaned = email.trim().toLowerCase();
  const admin = createAdminClient();

  const { error: removeAllowError } = await admin
    .from("allowed_emails")
    .delete()
    .eq("email", cleaned);
  if (removeAllowError) {
    return { error: removeAllowError.message };
  }

  const { data: users } = await admin.auth.admin.listUsers();
  const target = users?.users.find((u) => u.email === cleaned);
  if (target) {
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(
      target.id
    );
    if (deleteUserError) {
      return { error: deleteUserError.message };
    }
  }

  revalidatePath("/team");
  return { ok: true };
}

// Updates a profile's name and/or avatar. Self-target if target_user_id is
// omitted; otherwise the caller must be admin.
export async function updateMember(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const targetIdRaw = formData.get("target_user_id");
  const targetUserId =
    typeof targetIdRaw === "string" && targetIdRaw.length > 0
      ? targetIdRaw
      : user.id;

  if (targetUserId !== user.id) {
    const { data: caller } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();
    if (!caller?.is_admin) return { error: "Admin only" };
  }

  const nameRaw = formData.get("name");
  const name =
    typeof nameRaw === "string" ? nameRaw.trim().slice(0, 80) : null;

  const file = formData.get("avatar");
  const hasFile = file instanceof File && file.size > 0;

  if (name === null && !hasFile) {
    return { error: "Nothing to update" };
  }

  const admin = createAdminClient();
  const updates: { name?: string | null; avatar_url?: string } = {};

  if (name !== null) {
    updates.name = name.length > 0 ? name : null;
  }

  if (hasFile) {
    if (file.size > 5 * 1024 * 1024) {
      return { error: "Image must be under 5MB" };
    }
    if (!file.type.startsWith("image/")) {
      return { error: "File must be an image" };
    }
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const path = `${targetUserId}/avatar.${ext}`;
    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });
    if (uploadError) return { error: uploadError.message };
    const {
      data: { publicUrl },
    } = admin.storage.from("avatars").getPublicUrl(path);
    updates.avatar_url = `${publicUrl}?v=${Date.now()}`;
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update(updates)
    .eq("user_id", targetUserId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/", "layout");
  revalidatePath("/team");
  revalidatePath("/profile");
  return { ok: true, avatarUrl: updates.avatar_url ?? null, name: updates.name ?? null };
}

export async function setPassword(newPassword: string) {
  if (!newPassword || newPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: error.message };
  return { ok: true };
}
