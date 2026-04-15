import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Avatar API — upload / replace / delete the patient's profile picture.
 *
 * Routes:
 *   POST   /api/portal/avatar   → multipart upload (field: "file")
 *   DELETE /api/portal/avatar   → removes the current avatar
 *
 * ### Design notes
 *
 * - Bucket is PUBLIC — avatars render directly via the CDN URL, no
 *   signed URL round-trip on every dashboard load.
 * - Each user has exactly ONE avatar at the stable path
 *   `<user.id>/avatar.<ext>`. On replace, we upsert: true so the new
 *   upload overwrites the old one, and we also delete any old file
 *   with a different extension so we don't leave orphans.
 * - The profile's `avatar_url` column is updated atomically after a
 *   successful upload. The dashboard reads that column and renders
 *   the stored URL directly.
 */

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_EXTS = new Set(["jpg", "jpeg", "png", "webp"]);
const ALLOWED_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "file_field_required" },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "empty_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "file_too_large", max_bytes: MAX_BYTES },
      { status: 413 }
    );
  }
  if (!ALLOWED_MIMES.has(file.type)) {
    return NextResponse.json(
      { error: "unsupported_type" },
      { status: 415 }
    );
  }

  // Pick the extension from the MIME type (trust the browser's sniffed
  // type more than the filename — filenames can be spoofed, and the
  // bucket's allowed_mime_types also validates server-side).
  const ext = mimeToExt(file.type);
  const objectPath = `${user.id}/avatar.${ext}`;

  // Clean up any previous avatar that used a different extension so we
  // don't accumulate orphans.
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .list(user.id, { limit: 10 });

  if (existing && existing.length > 0) {
    const staleNames = existing
      .filter((o) => o.name && o.name !== `avatar.${ext}`)
      .map((o) => `${user.id}/${o.name}`);
    if (staleNames.length > 0) {
      await supabase.storage.from(BUCKET).remove(staleNames);
    }
  }

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type,
    });

  if (uploadErr) {
    return NextResponse.json(
      { error: uploadErr.message },
      { status: 500 }
    );
  }

  // Public URL — stable, CDN-backed, cheap to render.
  const { data: pub } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(objectPath);

  // Append a cache-busting timestamp so browsers pick up the new file
  // immediately after a replace (same path, different bytes).
  const avatarUrl = `${pub.publicUrl}?v=${Date.now()}`;

  // Persist the URL on the patient profile so the dashboard doesn't
  // have to re-list the bucket on every page load.
  const { error: profileErr } = await supabase
    .from("patient_profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  // If the profile row doesn't exist yet, that's fine — ignore the
  // error. The next profile sync will pick it up.
  if (profileErr && profileErr.code !== "PGRST116") {
    // eslint-disable-next-line no-console
    console.warn("avatar: profile update warning", profileErr.message);
  }

  return NextResponse.json({ avatar_url: avatarUrl });
}

export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Nuke everything in the user's folder (covers any stale extensions
  // from previous uploads).
  const { data: existing } = await supabase.storage
    .from(BUCKET)
    .list(user.id, { limit: 10 });

  if (existing && existing.length > 0) {
    const toRemove = existing
      .filter((o) => o.name)
      .map((o) => `${user.id}/${o.name}`);
    if (toRemove.length > 0) {
      const { error } = await supabase.storage
        .from(BUCKET)
        .remove(toRemove);
      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }
    }
  }

  await supabase
    .from("patient_profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}

function mimeToExt(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}
