import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Medical records API — list, upload, delete.
 *
 * Routes:
 *   GET    /api/portal/records       → list the user's files
 *   POST   /api/portal/records       → multipart upload (field: "file")
 *   DELETE /api/portal/records?name=<relative-path>
 *
 * ### Security model
 *
 * Every file lives in the `medical-records` bucket at the path
 *
 *     <user.id>/<original-filename>
 *
 * RLS policies on `storage.objects` enforce that any read/write/delete
 * requires the first folder segment to equal `auth.uid()::text`. We
 * never build a path from untrusted input — the user's UUID is taken
 * from the authenticated session, never from the request body.
 *
 * ### Why private + signed URLs
 *
 * The bucket is private, so direct public URLs don't work. To let the
 * dashboard render a "view" link, we mint a short-lived signed URL
 * (5-minute expiry) at list-time. This keeps medical documents out of
 * the CDN cache and out of browser history after the link expires.
 */

const BUCKET = "medical-records";

// Hard cap enforced at the bucket level too (20 MB), but we check here
// to return a friendlier error before the upload hits storage.
const MAX_BYTES = 20 * 1024 * 1024;

// -----------------------------------------------------------------------
// GET — list the authenticated user's files with signed view URLs
// -----------------------------------------------------------------------
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const folder = user.id;

  const { data: objects, error: listErr } = await supabase.storage
    .from(BUCKET)
    .list(folder, {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });

  if (listErr) {
    return NextResponse.json({ error: listErr.message }, { status: 500 });
  }

  // Mint a 5-minute signed URL for each file so the dashboard can link
  // to it without exposing a long-lived public URL.
  const files = await Promise.all(
    (objects ?? [])
      .filter((o) => o.name && !o.name.startsWith(".")) // skip .emptyFolderPlaceholder
      .map(async (o) => {
        const fullPath = `${folder}/${o.name}`;
        const { data: signed } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(fullPath, 60 * 5);

        return {
          name: o.name,
          path: fullPath,
          size: (o.metadata as { size?: number } | null)?.size ?? null,
          mime:
            (o.metadata as { mimetype?: string } | null)?.mimetype ?? null,
          created_at: o.created_at,
          url: signed?.signedUrl ?? null,
        };
      })
  );

  return NextResponse.json({ files });
}

// -----------------------------------------------------------------------
// POST — multipart upload (field name "file")
// -----------------------------------------------------------------------
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

  // Sanitise the filename — keep only letters, digits, dots, dashes,
  // underscores, and spaces (then collapse spaces to dashes). Prefix
  // with a timestamp so two uploads with the same name don't collide.
  const safeName = sanitiseFilename(file.name);
  const objectPath = `${user.id}/${Date.now()}_${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });

  if (uploadErr) {
    return NextResponse.json(
      { error: uploadErr.message },
      { status: 500 }
    );
  }

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, 60 * 5);

  return NextResponse.json({
    file: {
      name: safeName,
      path: objectPath,
      size: file.size,
      mime: file.type,
      created_at: new Date().toISOString(),
      url: signed?.signedUrl ?? null,
    },
  });
}

// -----------------------------------------------------------------------
// DELETE — remove a single file (path passed via ?name=)
// -----------------------------------------------------------------------
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  if (!name) {
    return NextResponse.json({ error: "name_required" }, { status: 400 });
  }

  // Defence-in-depth: reject anything that tries to escape the user's
  // folder. RLS would block it anyway, but failing fast here gives a
  // clearer error and avoids an unnecessary Storage round-trip.
  if (name.includes("..") || name.startsWith("/")) {
    return NextResponse.json({ error: "invalid_path" }, { status: 400 });
  }

  // The client sends either a full path ("<uuid>/file.pdf") or a bare
  // filename. Normalise to the full-path form, always scoped to the
  // authenticated user's folder.
  const path = name.startsWith(`${user.id}/`) ? name : `${user.id}/${name}`;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// -----------------------------------------------------------------------
function sanitiseFilename(name: string): string {
  // Strip path separators and keep a conservative character set.
  const base = name.split(/[\\/]/).pop() ?? "file";
  return (
    base
      .replace(/[^A-Za-z0-9._\- ]+/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 120) || "file"
  );
}
