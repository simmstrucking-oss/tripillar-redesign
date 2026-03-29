import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function isAdmin(req: NextRequest) {
  const header = req.headers.get('x-admin-secret');
  const cookie = req.cookies.get('lg-admin-session')?.value;
  return header === process.env.ADMIN_SECRET || cookie === process.env.ADMIN_SECRET;
}

const BUCKETS = ['facilitator-documents', 'admin-documents', 'restricted-documents'] as const;

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  interface FileEntry {
    name: string;
    bucket: string;
    folder: string;
    path: string;
    url: string | null;
  }

  const allFiles: FileEntry[] = [];

  for (const bucket of BUCKETS) {
    // List top-level folders
    const { data: topLevel } = await supabase.storage.from(bucket).list('', { limit: 200 });
    if (!topLevel) continue;

    for (const item of topLevel) {
      if (item.id === null && item.name) {
        // It's a folder — list contents
        const { data: files } = await supabase.storage.from(bucket).list(item.name, { limit: 500 });
        if (!files) continue;

        for (const file of files) {
          if (!file.name || file.id === null) {
            // Nested subfolder (e.g. 02_FACILITATOR/CFRG)
            const subPath = `${item.name}/${file.name}`;
            const { data: subFiles } = await supabase.storage.from(bucket).list(subPath, { limit: 200 });
            if (!subFiles) continue;
            for (const sf of subFiles) {
              if (!sf.name || sf.id === null) continue;
              const fullPath = `${subPath}/${sf.name}`;
              const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(fullPath, 60);
              allFiles.push({
                name: sf.name,
                bucket,
                folder: subPath,
                path: fullPath,
                url: signed?.signedUrl ?? null,
              });
            }
          } else {
            const fullPath = `${item.name}/${file.name}`;
            const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(fullPath, 60);
            allFiles.push({
              name: file.name,
              bucket,
              folder: item.name,
              path: fullPath,
              url: signed?.signedUrl ?? null,
            });
          }
        }
      } else if (item.id) {
        // Root-level file
        const { data: signed } = await supabase.storage.from(bucket).createSignedUrl(item.name, 60);
        allFiles.push({
          name: item.name,
          bucket,
          folder: '/',
          path: item.name,
          url: signed?.signedUrl ?? null,
        });
      }
    }
  }

  // Log admin access (batch)
  if (allFiles.length > 0) {
    const logs = allFiles.map(f => ({
      document_name: f.name,
      bucket: f.bucket,
      role: 'admin',
    }));
    supabase.from('document_access_log').insert(logs).then(() => {});
  }

  // Organize by folder
  const folderMap = new Map<string, FileEntry[]>();
  for (const f of allFiles) {
    const key = `${f.bucket}/${f.folder}`;
    if (!folderMap.has(key)) folderMap.set(key, []);
    folderMap.get(key)!.push(f);
  }

  const folders = Array.from(folderMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([folder, files]) => ({
      folder,
      files: files.sort((a, b) => a.name.localeCompare(b.name)),
    }));

  return NextResponse.json({ folders, total: allFiles.length });
}
