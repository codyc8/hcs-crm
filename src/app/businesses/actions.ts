"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ColumnId, Source, Vertical } from "@/lib/types";

const VERTICALS: Vertical[] = [
  "restaurant",
  "salon",
  "barbershop",
  "contractor",
  "retail",
  "fitness",
  "other",
];

const SOURCES: Source[] = [
  "walk_in",
  "email",
  "ig_dm",
  "warm_intro",
  "scraped",
  "other",
];

const STATUSES: ColumnId[] = [
  "cold",
  "outreached",
  "interested",
  "scheduled",
  "won",
  "lost",
];

function strOrNull(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (typeof v !== "string") return null;
  const trimmed = v.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export async function createBusiness(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const name = strOrNull(formData, "name");
  if (!name) return { error: "Name is required" };

  const verticalRaw = strOrNull(formData, "vertical") ?? "other";
  const vertical = (VERTICALS.includes(verticalRaw as Vertical)
    ? verticalRaw
    : "other") as Vertical;

  const sourceRaw = strOrNull(formData, "source");
  const source =
    sourceRaw && SOURCES.includes(sourceRaw as Source)
      ? (sourceRaw as Source)
      : null;

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      name,
      vertical,
      address: strOrNull(formData, "address"),
      phone: strOrNull(formData, "phone"),
      summary: strOrNull(formData, "summary"),
      contact_name: strOrNull(formData, "contact_name"),
      contact_relationship: strOrNull(formData, "contact_relationship"),
      contact_phone: strOrNull(formData, "contact_phone"),
      source,
      status: "cold",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true, business: data };
}

export async function moveBusinessStatus(id: string, status: ColumnId) {
  if (!STATUSES.includes(status)) return { error: "Invalid status" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("businesses")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}

export async function deleteBusiness(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("businesses").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/");
  return { ok: true };
}
