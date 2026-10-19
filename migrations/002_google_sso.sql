DO $migration$
BEGIN
  PERFORM pg_advisory_xact_lock(842736519);
  IF EXISTS (SELECT 1 FROM documind_schema_versions WHERE version=2) THEN RETURN; END IF;
  ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
  CREATE TABLE sso_identities(
    provider text NOT NULL CHECK(provider='google'),
    subject text NOT NULL CHECK(char_length(subject) BETWEEN 1 AND 255),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY(provider,subject), UNIQUE(user_id,provider)
  );
  CREATE TABLE oauth_attempts(
    state_hash text PRIMARY KEY,
    browser_hash text NOT NULL,
    verifier text NOT NULL,
    nonce text NOT NULL,
    link_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    expires_at bigint NOT NULL
  );
  CREATE INDEX oauth_attempts_expiry ON oauth_attempts(expires_at);
  INSERT INTO documind_schema_versions(version) VALUES(2);
END
$migration$;
