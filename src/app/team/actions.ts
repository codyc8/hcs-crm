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
