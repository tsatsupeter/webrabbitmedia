# Fix JuniPay collections: no prompt is actually being sent

The last two live charges were recorded as "pending" and the UI told you the prompt was on its way, but JuniPay never accepted them. The stored provider response for both is:

```text
{ "code": 401, "message": "\"email\" is not allowed" }
```

So JuniPay rejected the request payload outright — no prompt was ever pushed to the handset.

## What the docs say

The JuniPay `/payment` endpoint (Collections) accepts exactly these fields:

`email`, `phoneNumber`, `channel`, `provider`, `amount`, `description`, `foreignID`, `callbackUrl`

Our request currently sends extra fields on top of that (`senderEmail`, `email` and `tot_amnt`) and the live API validates strictly, rejecting the request. The earlier "senderEmail field is required" error came from the same strict validator on a different field combination, so the payload has to be trimmed to exactly what the live API accepts, with the email field name confirmed against the live host rather than guessed.

A successful call returns `{ status: "pending", message: "TRANSACTION PENDING", transID, foreignID, reqToken }` — only then has a prompt actually gone out.

## Two problems to fix

1. **Payload shape.** Send only the documented fields for `/payment`. Confirm which email key the live host accepts (`email` per the docs, `senderEmail` per the live error) with a single probe call against the live API before finalising, so we stop trading one validation error for another. Drop `tot_amnt` and the duplicate email key.

2. **Silent failure reported as success.** JuniPay returned HTTP 200 with `code: 401` in the body, and our code only looks at the HTTP status, so it mapped the result to "pending" and the dashboard said the prompt was sent. Collections must be treated as pending **only** when the body says `status: pending` and carries a `transID`. Any body carrying an error `code`/`message`, or missing `transID`, is a failure — surfaced to the merchant as a failed charge with JuniPay's message, not a phantom prompt.

## Verification

- Probe the live `/payment` endpoint with GHS 1 to confirm the accepted payload, then run one real GHS 1 charge to 0248980332 and confirm a prompt arrives on the handset.
- Confirm the transaction is stored with `transID` in `provider_reference` and status `pending`, then settles to `approved` via the `junipay-callback` webhook after you approve on the handset.
- Re-run a deliberately bad payload to confirm it now shows as failed with the real reason instead of "prompt sent".

## Technical detail

- `supabase/functions/_shared/junipay.ts` — `collect()` sends only `{ channel, provider, phoneNumber, amount, description, <email key>, foreignID, callbackUrl }`; remove `tot_amnt` and the duplicate email field. Keep the 13-char `foreignID` padding (matches the docs example `17263839290373`).
- `supabase/functions/_shared/junipay.ts` — add a collection-result mapper: pending requires `status === 'pending'` plus a `transID`; a numeric `code` outside 2xx or a missing `transID` maps to `failed` with `message` as the reason.
- `supabase/functions/_shared/gateway.ts` — `collect()` for JuniPay uses that mapper instead of the current `res.ok ? mapStatus(...)` logic, so `merchant-collect-momo` and `collect-momo` both report the real outcome and return a non-200 HTTP status on rejection.
- `supabase/functions/junipay-callback/index.ts` — unchanged; the padded `foreignID` is already un-padded before matching.
- Redeploy `merchant-collect-momo`, `collect-momo`, `checkout-session`.
