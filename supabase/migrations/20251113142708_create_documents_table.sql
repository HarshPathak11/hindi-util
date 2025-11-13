/*
  # Create documents table for PDF generation history

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `input_text` (text) - original user input
      - `input_language` (text) - language of input: english, hinglish, hindi
      - `translated_text` (text) - Hindi translated/converted text
      - `header_text` (text) - fixed text for top-left
      - `footer_text` (text) - fixed text for bottom-right
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Security
    - Enable RLS on `documents` table
    - Documents are treated as public (no user auth required initially)
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text text NOT NULL,
  input_language text NOT NULL DEFAULT 'english',
  translated_text text NOT NULL,
  header_text text DEFAULT '',
  footer_text text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Documents are publicly readable"
  ON documents
  FOR SELECT
  USING (true);

CREATE POLICY "Documents can be created by anyone"
  ON documents
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Documents can be updated by anyone"
  ON documents
  FOR UPDATE
  WITH CHECK (true);

CREATE POLICY "Documents can be deleted by anyone"
  ON documents
  FOR DELETE
  USING (true);
