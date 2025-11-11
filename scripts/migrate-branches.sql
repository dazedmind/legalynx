-- Migration: Extract JSON branches into database rows
-- Step 1: Add new columns (keeping old ones temporarily)

ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sequence_number INTEGER,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Step 2: Create snapshots table
CREATE TABLE IF NOT EXISTS chat_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message_ids JSONB NOT NULL,
  edit_source_id UUID,
  snapshot_type TEXT DEFAULT 'EDIT',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_snapshots_session ON chat_snapshots(session_id, created_at);

-- Step 3: For each message with branches, create snapshots
-- (This preserves the branch history without blocking the migration)
INSERT INTO chat_snapshots (session_id, message_ids, edit_source_id, snapshot_type)
SELECT 
  session_id,
  branches,
  id as edit_source_id,
  'MIGRATION' as snapshot_type
FROM chat_messages
WHERE branches IS NOT NULL AND branches != 'null'::jsonb;

-- Step 4: Mark all messages as active (we'll handle inactive messages in application logic)
UPDATE chat_messages SET is_active = true WHERE is_active IS NULL;

-- Step 5: Now safe to drop the old columns
-- (Run this after confirming the migration worked)
-- ALTER TABLE chat_messages DROP COLUMN IF EXISTS branches;
-- ALTER TABLE chat_messages DROP COLUMN IF EXISTS current_branch;

-- Migration complete!
-- Next steps:
-- 1. Verify snapshots were created: SELECT COUNT(*) FROM chat_snapshots;
-- 2. If all looks good, uncomment and run the DROP COLUMN statements above
-- 3. Run: npx prisma db pull to sync the schema
-- 4. Run: npx prisma generate to update the client

