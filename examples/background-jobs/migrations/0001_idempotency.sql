CREATE TABLE IF NOT EXISTS background_job_idempotency (
  idempotency_key TEXT PRIMARY KEY
    CHECK (length(idempotency_key) BETWEEN 1 AND 128),
  state TEXT NOT NULL
    CHECK (state IN ('processing', 'completed')),
  lease_token TEXT,
  lease_expires_at INTEGER,
  completed_at INTEGER,
  expires_at INTEGER,
  CHECK (
    (
      state = 'processing'
      AND lease_token IS NOT NULL
      AND lease_expires_at IS NOT NULL
      AND completed_at IS NULL
      AND expires_at IS NULL
    )
    OR
    (
      state = 'completed'
      AND lease_token IS NULL
      AND lease_expires_at IS NULL
      AND completed_at IS NOT NULL
      AND expires_at IS NOT NULL
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_background_job_idempotency_expiry
  ON background_job_idempotency (state, expires_at, lease_expires_at);
