## Goal
Flip ECHODATE to `approved`, mint a live API key, and run a real GHS 1.00 MTN collection against **0248980332** via Payswitch production.

⚠️ This is a **real-money** charge on your MTN MoMo wallet. You'll get a MoMo prompt on the phone and need to authorize it.

## Steps

1. **Approve the business** (migration)
   ```sql
   UPDATE public.businesses
   SET status = 'approved'
   WHERE id = 'aa6fead6-bb93-4db1-9b77-136fddf73487';
   ```

2. **Mint a live API key** for ECHODATE by inserting into `public.api_keys` with `mode='live'`, capturing the raw `lk_live_…` token (shown once in chat so you can reuse it).

3. **Call `collect-momo`** edge function with that live key:
   - `amount: 1.00`
   - `subscriber_number: "0248980332"`
   - `network: "MTN"`
   - `desc: "Live test - Web Rabbit"`
   - `customer_email: "hello@tsatsupeter.com"`

4. **Report back**: Payswitch response code/reason, transaction ID, and confirm the row appears in the Live-mode ledger (`/merchant/transactions/payments` with the Live toggle on). Fee split will be Gross 1.00 / Fee 0.15 / Net 0.85.

5. If Payswitch returns `pending`, poll `transaction-status` after you approve the prompt on your phone.

## Notes
- All 4 `PAYSWITCH_LIVE_*` secrets are already configured.
- The shared helper auto-routes live keys to `https://prod.theteller.net`.
- No code changes — just the SQL approval + runtime test.

Confirm to proceed (real money will move).
