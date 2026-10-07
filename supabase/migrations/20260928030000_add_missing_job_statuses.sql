-- The job_status enum was created with only ('saved', 'applied', 'screening',
-- 'interview', 'offer', 'rejected', 'withdrawn') — it never actually gained
-- "no_response" or "archived", even though src/types/database.ts and the app
-- (the 30-day no-response auto-nudge on the Applications board, and the
-- "No Response / Rejected" application-status control) have relied on both
-- for a while. Setting a job to either has been silently failing with
-- "invalid input value for enum job_status" until this is applied.
alter type job_status add value if not exists 'no_response';
alter type job_status add value if not exists 'archived';
