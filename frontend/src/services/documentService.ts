import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface DocumentData {
  input_text: string;
  input_language: string;
  translated_text: string;
  header_text: string;
  footer_text: string;
}

export interface Document extends DocumentData {
  id: string;
  created_at: string;
  updated_at: string;
}

export async function saveDocument(data: DocumentData): Promise<Document> {
  const { data: result, error } = await supabase
    .from('documents')
    .insert([
      {
        input_text: data.input_text,
        input_language: data.input_language,
        translated_text: data.translated_text,
        header_text: data.header_text,
        footer_text: data.footer_text,
      },
    ])
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to save document: ${error.message}`);
  }

  return result as Document;
}

export async function getDocuments(): Promise<Document[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch documents: ${error.message}`);
  }

  return data as Document[];
}

export async function updateDocument(
  id: string,
  updates: Partial<DocumentData>
): Promise<Document> {
  const { data, error } = await supabase
    .from('documents')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update document: ${error.message}`);
  }

  return data as Document;
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete document: ${error.message}`);
  }
}
