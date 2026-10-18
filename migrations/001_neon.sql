-- One atomic statement, usable from Neon SQL Editor or `npm run db:migrate`.
-- No sample accounts or documents are inserted.
DO $migration$
BEGIN
  PERFORM pg_advisory_xact_lock(842736519);
  CREATE TABLE IF NOT EXISTS documind_schema_versions(version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
  IF EXISTS (SELECT 1 FROM documind_schema_versions WHERE version=1) THEN RETURN; END IF;
  CREATE TABLE users(id uuid PRIMARY KEY,email text NOT NULL UNIQUE,name text NOT NULL,company text NOT NULL DEFAULT '',password_hash text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
  CREATE TABLE sessions(token_hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires_at bigint NOT NULL);
  CREATE INDEX sessions_user ON sessions(user_id);
  CREATE TABLE auth_attempts(key text PRIMARY KEY,attempts integer NOT NULL,reset_at bigint NOT NULL);
  CREATE TABLE documents(
    id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),name text NOT NULL CHECK(char_length(name) BETWEEN 1 AND 240),file_type text NOT NULL CHECK(file_type IN ('PDF','DOCX','HWPX','TXT','MD','MARKDOWN')),
    size_bytes integer NOT NULL CHECK(size_bytes BETWEEN 1 AND 20971520),blob_path text NOT NULL UNIQUE,
    category text NOT NULL DEFAULT '미분류',status text NOT NULL DEFAULT 'processing' CHECK(status IN ('processing','ready','failed')),
    chunk_count integer NOT NULL DEFAULT 0,page_count integer NOT NULL DEFAULT 0,extracted_text text NOT NULL DEFAULT '',error_message text,
    processing_token uuid,processing_started_at bigint,uploaded_at timestamptz,upload_token_expires_at bigint NOT NULL DEFAULT 0,
    deleted_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,user_id),
    CHECK(blob_path=user_id::text||'/'||id::text||'/original.'||lower(file_type))
  );
  CREATE INDEX documents_user ON documents(user_id,created_at DESC);
  CREATE TABLE document_chunks(id uuid PRIMARY KEY,document_id uuid NOT NULL,user_id uuid NOT NULL,position integer NOT NULL CHECK(position>=0),content text NOT NULL CHECK(char_length(content) BETWEEN 1 AND 1200),
    search_vector tsvector GENERATED ALWAYS AS(to_tsvector('simple',content)) STORED,
    FOREIGN KEY(document_id,user_id) REFERENCES documents(id,user_id) ON DELETE CASCADE,UNIQUE(document_id,position));
  CREATE INDEX chunks_user ON document_chunks(user_id,document_id);
  CREATE INDEX chunks_fts ON document_chunks USING gin(search_vector);
  CREATE TABLE conversations(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES users(id),title text NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,user_id));
  CREATE INDEX conversations_user ON conversations(user_id,created_at DESC);
  CREATE TABLE chat_turns(id uuid PRIMARY KEY,user_id uuid NOT NULL,conversation_id uuid NOT NULL,question text NOT NULL,answer text NOT NULL,citations jsonb NOT NULL,mode text NOT NULL CHECK(mode IN ('extractive','generated','no_match')),created_at timestamptz NOT NULL DEFAULT now(),FOREIGN KEY(conversation_id,user_id) REFERENCES conversations(id,user_id) ON DELETE CASCADE);
  CREATE INDEX turns_user ON chat_turns(user_id,created_at DESC);
  CREATE INDEX turns_conversation ON chat_turns(conversation_id,created_at);
  INSERT INTO documind_schema_versions(version) VALUES(1);
END
$migration$;
