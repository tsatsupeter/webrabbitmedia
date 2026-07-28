ALTER TABLE public.bank_verification
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY business_id ORDER BY created_at ASC) AS rn
  FROM public.bank_verification
)
UPDATE public.bank_verification b
SET is_primary = true
FROM ranked r
WHERE b.id = r.id AND r.rn = 1;

CREATE UNIQUE INDEX IF NOT EXISTS bank_verification_one_primary_per_business
  ON public.bank_verification(business_id)
  WHERE is_primary = true;