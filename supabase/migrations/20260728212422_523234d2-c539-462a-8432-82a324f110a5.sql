INSERT INTO public.api_keys (business_id, user_id, name, key_prefix, key_hash, access, mode, expires_at)
VALUES (
  'aa6fead6-bb93-4db1-9b77-136fddf73487',
  '09d70a47-05e5-4a8b-8c50-c8219e7259d8',
  '__audit_temp_2026_07_28',
  'wr_test_Oq',
  'f42a3eb63c395fe0da8983b1c93436b32211b1d65121b6d31f9d130ed5c1033a',
  'read',
  'test',
  now() + interval '1 hour'
);