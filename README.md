# BPS – Balkan Precision Solutions

Production-ready landing page for BPS, an independent industrial sourcing and supplier management consultancy connecting German companies with qualified manufacturing partners in Bosnia and Herzegovina.

## Run locally

Use Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local address shown in the terminal. Create a production build with `npm run build` and check code quality with `npm run lint`.

## Edit the site

- Page content and section data: `app/page.tsx`
- Colors, layout, responsive rules and animation: `app/globals.css`
- SEO title and description: `app/layout.tsx`
- Secure inquiry boundary: `app/api/inquiry/route.ts`
- CNC hero image: `public/cnc-milling.jpg`
- BPS logo: `public/bps-logo.png`

## Inquiry delivery and private uploads

The browser posts multipart form data only to `/api/inquiry`. That server route validates and sanitizes all fields, enforces the file allow-list and size limits, applies a honeypot/timing check, generates non-guessable upload names, and forwards the request to a protected deployment adapter. The browser never receives storage credentials or permanent public document URLs.

Copy `.env.example` to `.env.local` for local integration work. Required production configuration:

- `INQUIRY_SUBMISSION_ENDPOINT`: HTTPS endpoint for the approved private-storage and email-notification adapter.
- `INQUIRY_SUBMISSION_TOKEN`: server-only bearer token for that adapter.
- `INQUIRY_DESTINATION_EMAIL`: notification destination; defaults to `info@bps-sourcing.de`.
- `RFQ_STORAGE_PROVIDER` and `RFQ_STORAGE_BUCKET`: private object-storage destination used by the adapter.
- `RFQ_RETENTION_DAYS`: deletion/retention policy passed to the adapter.
- `RFQ_MAX_FILE_SIZE_MB`: server-side per-file limit; defaults to 15 MB.

The production adapter must write files to private object storage, create only short-lived signed access links for authorized BPS recipients, send the notification email after storage succeeds, and apply the documented deletion schedule. A successful message is shown in the UI only after the adapter returns a successful response. Without these variables, local submission intentionally returns a clear configuration error instead of simulating success.

Before launch, add the approved Imprint and Privacy pages, confirm the GDPR retention period and processor agreements, and replace the editable legal-company placeholder in the footer. Do not place provider credentials in client-side variables.

## Accessibility and responsive behavior

The page uses semantic sections, keyboard-focusable navigation, a skip link, smooth anchor scrolling, reduced-motion support, responsive imagery and a keyboard-operable mobile menu.
