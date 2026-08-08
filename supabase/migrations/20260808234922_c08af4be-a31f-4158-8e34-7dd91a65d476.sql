ALTER TABLE public.business_verification
  ADD COLUMN IF NOT EXISTS registration_form_doc_path text,
  ADD COLUMN IF NOT EXISTS owner_ghana_card_path text,
  ADD COLUMN IF NOT EXISTS director1_ghana_card_path text,
  ADD COLUMN IF NOT EXISTS director2_ghana_card_path text;