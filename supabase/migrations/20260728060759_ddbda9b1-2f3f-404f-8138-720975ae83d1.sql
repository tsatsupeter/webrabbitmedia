
UPDATE public.businesses
SET status = 'approved', updated_at = now()
WHERE id = 'aa6fead6-bb93-4db1-9b77-136fddf73487';

INSERT INTO public.api_keys (business_id, user_id, name, key_prefix, key_hash, access, mode)
VALUES (
  'aa6fead6-bb93-4db1-9b77-136fddf73487',
  '09d70a47-05e5-4a8b-8c50-c8219e7259d8',
  'Live test key',
  'lk_live_9f4c2d',
  encode(digest('lk_live_9f4c2d1a8b7e6f5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c', 'sha256'), 'hex'),
  'write',
  'live'
);
