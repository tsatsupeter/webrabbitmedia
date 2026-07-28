## Add the Web Rabbit Media logo to transactional emails

The email template in `supabase/functions/_shared/email/template.ts` currently renders the brand as text ("Web Rabbit Media" wordmark inside the accent-green circle). The real logo already ships at `public/webrabbitmedia-logo-green.jpeg` and is served on the production site.

### Change
- In `template.ts`, set `BRAND.logo` to the absolute URL `https://webrabbitmedia.com/webrabbitmedia-logo-green.jpeg` (email clients require absolute URLs).
- Replace the current text-only header block with an `<img>` tag using that URL, sized ~40×40 (retina-ready via `width`/`height` attrs + `max-width` inline style), `alt="Web Rabbit Media"`, kept inside the same accent-green rounded container so the branding still matches the auth/dashboard shell.
- Keep the wordmark text next to the logo for clients that block images (with `display:block` fallback via `alt`).
- Redeploy `send-email` and fire one real test send to `tsatsupeter@gmail.com` (payment_received sample) to confirm the logo renders in Gmail.

### Out of scope
- No changes to trigger logic, preferences, or any other event copy.
- Not uploading the logo to the CDN — it already lives at a stable public URL on the marketing site.
