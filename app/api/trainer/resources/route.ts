import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserFromRequest } from '@/lib/auth-helper';

interface Document {
  name: string;
  url: string | null;
  confidential: boolean;
  bucket: string;
  path: string;
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check role
  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('id, role, books_authorized_to_train')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'trainer' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get trainer certification ID for the agreement document
  const { data: trainerCert } = await supabase
    .from('trainer_certifications')
    .select('id')
    .eq('trainer_id', profile.id)
    .limit(1)
    .single();

  const booksAuthorized: number[] = profile.books_authorized_to_train ?? [];

  // Build per-book document definitions
  const bookDocDefs: Array<{ bookNumber: number; name: string; bucket: string; path: string; confidential: boolean }> = [];

  for (const bookNum of booksAuthorized) {
    bookDocDefs.push(
      {
        bookNumber: bookNum,
        name: `Facilitator Certification Training Manual — Book ${bookNum}`,
        bucket: 'facilitator-documents',
        path: `training-manuals/LG_Book${bookNum}_Training_Manual.pdf`,
        confidential: false,
      },
      {
        bookNumber: bookNum,
        name: `Trainer Answer Key — Book ${bookNum}`,
        bucket: 'trainer-documents',
        path: `answer-keys/LG_Book${bookNum}_Answer_Key.pdf`,
        confidential: true,
      },
      {
        bookNumber: bookNum,
        name: `Assessment Participant Copy — Book ${bookNum}`,
        bucket: 'facilitator-documents',
        path: `assessments/LG_Book${bookNum}_Assessment_Participant.pdf`,
        confidential: false,
      }
    );
  }

  // General documents (always available)
  const generalDocDefs = [
    {
      name: 'Certification Record Submission Template',
      bucket: 'trainer-documents',
      path: 'templates/LG_Certification_Record_Template.csv',
      confidential: false,
    },
    {
      name: 'Your Signed Trainer Agreement',
      bucket: 'trainer-documents',
      path: `agreements/${trainerCert?.id ?? 'unknown'}_agreement.pdf`,
      confidential: false,
    },
  ];

  // Generate signed URLs for all documents
  async function generateSignedUrl(
    bucket: string,
    path: string,
    confidential: boolean
  ): Promise<string | null> {
    const expiresIn = confidential ? 60 : 3600;
    const { data } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    return data?.signedUrl ?? null;
  }

  // Process book documents grouped by book number
  const books: Record<number, Document[]> = {};

  const bookPromises = bookDocDefs.map(async (def) => {
    const url = await generateSignedUrl(def.bucket, def.path, def.confidential);
    return { ...def, url };
  });

  const bookResults = await Promise.all(bookPromises);

  for (const result of bookResults) {
    const { bookNumber, name, url, confidential, bucket, path } = result;
    if (!books[bookNumber]) {
      books[bookNumber] = [];
    }
    books[bookNumber].push({ name, url, confidential, bucket, path });
  }

  // Process general documents
  const generalPromises = generalDocDefs.map(async (def) => {
    const url = await generateSignedUrl(def.bucket, def.path, def.confidential);
    return { name: def.name, url, confidential: def.confidential, bucket: def.bucket, path: def.path };
  });

  const general: Document[] = await Promise.all(generalPromises);

  return NextResponse.json({ books, general });
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check role
  const { data: profile } = await supabase
    .from('facilitator_profiles')
    .select('id, role, books_authorized_to_train')
    .eq('user_id', user.id)
    .single();

  if (!profile || (profile.role !== 'trainer' && profile.role !== 'super_admin')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { document_name?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { document_name } = body;

  if (!document_name) {
    return NextResponse.json({ error: 'Missing required field: document_name' }, { status: 400 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;

  const { error } = await supabase
    .from('trainer_document_downloads')
    .insert({
      trainer_id: profile.id,
      document_name,
      ip_address: ip,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
