DO $migration$
BEGIN
  PERFORM pg_advisory_xact_lock(842736519);
  IF EXISTS (SELECT 1 FROM documind_schema_versions WHERE version=3) THEN RETURN; END IF;
  ALTER TABLE documents ADD COLUMN rag_revision uuid NOT NULL DEFAULT gen_random_uuid();
  -- Normalized 512-dimensional vectors use exact cosine search in the existing
  -- database. No separately billed vector service or extension is required.
  CREATE TABLE rag_embeddings(
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model text NOT NULL, text_hash text NOT NULL,
    embedding real[] NOT NULL CHECK(array_length(embedding,1)=512),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY(user_id,model,text_hash)
  );
  CREATE TABLE rag_answer_cache(
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cache_key text NOT NULL, answer text NOT NULL, citations jsonb NOT NULL,
    mode text NOT NULL CHECK(mode IN ('generated','no_match')),
    expires_at bigint NOT NULL, PRIMARY KEY(user_id,cache_key)
  );
  CREATE TABLE rag_usage(
    scope text NOT NULL, day date NOT NULL,
    chat_requests integer NOT NULL DEFAULT 0,
    embedding_characters integer NOT NULL DEFAULT 0,
    PRIMARY KEY(scope,day)
  );
  INSERT INTO documind_schema_versions(version) VALUES(3);
END
$migration$;
