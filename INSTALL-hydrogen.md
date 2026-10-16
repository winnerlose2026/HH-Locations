# Store Locator Fix — Install Notes (Hydrogen / Oxygen)

**Site:** www.hhbagels.com — Shopify **Hydrogen** storefront on **Oxygen** (confirmed via `powered-by: Shopify, Oxygen, Hydrogen`).
**Bug:** Stockist store-locator banners showed the wrong state on ZIP search (e.g. 33156 / Pinecrest FL appeared under a "CALIFORNIA" banner). Root cause: the old Stockist Custom CSS labeled fixed **row positions** (`nth-child(1)="California"`, `nth-child(7)="Florida"`, …); a search re-sorts the list by distance, so row 1 is no longer a California store but still got the California banner.
**Fix:** drive banners from each store's real state instead of row position. Two parts — a CSS swap in the Stockist dashboard, and a small first-party script in the Hydrogen app.

---

## Why this can't go through GTM

The site sends a **nonce-based Content-Security-Policy** (`script-src` includes a per-request nonce, **no `'unsafe-inline'`, no `'strict-dynamic'`**). Verified on `/contact`: an inline `<script>` injected the way GTM injects Custom HTML tags **does not execute** — CSP blocks it. GTM's own external tags load (googletagmanager.com is allowlisted), but arbitrary inline JS via GTM is blocked. A first-party script added in the Hydrogen app is served with the page nonce and complies automatically.

---

## Part 1 — CSS (Stockist dashboard, no deploy)

Stockist dashboard → **Settings → Appearance → Advanced → Custom CSS**. Replace the entire current block with the contents of **`stockist-custom-css.css`**. It keeps the existing card styling and responsive rules; only the header mechanism changes (banners now come from a `data-hh-state` attribute instead of `nth-child` positions).

This also retires the old maintenance burden: location **priorities** no longer need to be hand-set to keep headers correct (grouping by state still gives the tidiest default browse list, but it's no longer required for correctness).

## Part 2 — Script (Hydrogen codebase)

Add the contents of **`stockist-state-headers.js`** as a first-party script. Recommended placement: `app/root.tsx`, in the document `<head>` (or just before `</body>`), tagged with the existing nonce.

The Hydrogen skeleton already exposes the nonce via `useNonce()` and wraps scripts with it. Two equivalent options:

**Option A — inline with nonce (simplest):**
```tsx
// app/root.tsx — inside the Layout component
import { useNonce } from '@shopify/hydrogen';
import stockistStateHeaders from '~/lib/stockist-state-headers.js?raw'; // bundler raw import
// ...
const nonce = useNonce();
// ...in the returned <head> or before </body>:
<script
  nonce={nonce}
  suppressHydrationWarning
  dangerouslySetInnerHTML={{ __html: stockistStateHeaders }}
/>
```

**Option B — external file with nonce:**
1. Drop `stockist-state-headers.js` in `/public/` (served from the storefront origin).
2. In `app/root.tsx`:
```tsx
<script nonce={nonce} src="/stockist-state-headers.js" defer />
```
The `nonce` satisfies the CSP regardless of the `script-src` allowlist. (If you prefer to rely on the allowlist instead of the nonce, confirm `'self'` is present in `script-src` in `entry.server.tsx`'s `createContentSecurityPolicy` config.)

Either option: the locator appears on the homepage (`/`) and `/contact`, so a global placement in `root.tsx` is correct. The script self-guards (does nothing when no locator is present) and uses a document-level MutationObserver, so it also handles Hydrogen client-side route changes that re-mount the widget without a full reload.

## Deploy
Commit and push — Oxygen builds and deploys the storefront (via the connected GitHub integration / `npx shopify hydrogen deploy`).

## Verify
On the live site, open the locator and search **33156**. Expected: a single **FLORIDA** banner above Pinecrest and Wynwood/Midtown — no "CALIFORNIA". (Tested working in-browser with this exact CSS + script.)
