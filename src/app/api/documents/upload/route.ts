import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

const DOCUMENT_BUCKET = 'documents';

export async function POST(request: Request) {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
        remove(name: string, options: any) { cookieStore.set({ name, value: '', ...options }) },
      },
    }
  );

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const uploadType = formData.get('type') as string;

    if (!file) {
      return new NextResponse(JSON.stringify({ error: 'File is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const filePath = `${session.user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from(DOCUMENT_BUCKET).upload(filePath, file);

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from(DOCUMENT_BUCKET).getPublicUrl(filePath);
    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL");
    }

    const { data: document, error: dbError } = await supabase.from('documents').insert({
      user_id: session.user.id,
      name: file.name,
      type: uploadType as any,
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
    }).select().single();

    if (dbError) {
      throw dbError;
    }

    return NextResponse.json(document);

  } catch (e: any) {
    console.error('Unexpected error in /api/documents/upload:', e);
    return new NextResponse(JSON.stringify({ error: 'An unexpected error occurred.', details: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
} 