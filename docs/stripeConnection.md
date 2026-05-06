# Front-end integration: Stripe Connect invoices & client portal

This document summarizes what the Aquatechy **backend** now exposes after the Stripe Connect + invoice payments + magic-link client portal work. Use it to update or build the corresponding **front-end** experiences (company web app and, if separate, the **client-facing micro-portal**).

---

## Mental model: two authenticated surfaces

| Surface | Who | Auth mechanism | Base path |
| --- | --- | --- | --- |
| **Company app** | Owners, Admins, Office (role-dependent per route) | Existing user session JWT (`Authorization: Bearer …`, same as today) | `/api/v1/…` under authenticated routes |
| **Client portal** | Pool service clients (homeowners), no Aquatechy password | Short-lived JWT with `scope: "client"` after exchanging a **one-time** email token | `/api/v1/client-portal/…` |

Do **not** send `clientId` in the body for portal routes to “pick” a client. The backend derives the client strictly from the portal JWT (`sub`).

---

## Environment URLs the front-end must agree with

The backend reads these from env (defaults in `.env.example`). Your deployed front-end URLs **must match** what is configured server-side so Stripe redirects land on real pages.

| Variable (backend) | Purpose | Front-end work |
| --- | --- | --- |
| `STRIPE_CONNECT_REFRESH_URL` / `STRIPE_CONNECT_RETURN_URL` | Stripe Connect onboarding | Implement a **Payments / Stripe settings** route (e.g. `/settings/payments`) that reads `?status=refresh` / `?status=return` query params and refreshes Connect status via API. |
| `STRIPE_INVOICE_CHECKOUT_SUCCESS_URL` | After paying an invoice in Checkout | Must include Stripe’s **`{CHECKOUT_SESSION_ID}`** placeholder ([Stripe docs](https://docs.stripe.com/payments/checkout/custom-success-page)). Implement a success page that shows confirmation; invoice finalization happens via webhook, not this page. |
| `STRIPE_INVOICE_CHECKOUT_CANCEL_URL` | User cancels Checkout | Implement a cancel fallback (e.g. return to invoice detail). |
| `STRIPE_SETUP_SUCCESS_URL` / `STRIPE_SETUP_CANCEL_URL` | Save-card (Setup mode Checkout) return | Implement pages under the path your backend expects (defaults point at `/client-portal/payment-method?status=…` on the **app** domain—align with wherever you host the portal). |
| `CLIENT_PORTAL_BASE_URL` | Links in emails (`…/auth?token=…`) | The **client portal** origin must expose an `/auth` (or equivalent) handler that exchanges the token (see below). |

If the company app and client portal share one SPA with different routes, configure these URLs accordingly in each environment.

---

## New / changed API: company app (user JWT)

Base URL prefix: **`/api/v1`**. All of the following require **`verifySession`** (same auth as existing authenticated API).

### Stripe Connect (per company)

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| `POST` | `/payments/connect/onboard` | `{ "companyId": "<id>" }` | **Owner or Admin only.** Returns `{ url, stripeAccountId }`. Redirect the browser to `url` (Stripe-hosted onboarding). Creates a connected account when missing. |
| `GET` | `/payments/connect/status` | Query: `companyId=<id>` | **Owner, Admin, or Office.** Returns live Stripe account state (and persists flags on the company). See response shape below. |
| `POST` | `/payments/connect/dashboard-link` | `{ "companyId": "<id>" }` | **Owner or Admin only.** Returns `{ url }` (Stripe Express login link). |

**Typical Connect status response**

- `stripeAccountId`: `string | null`
- `stripeAccountStatus`: `not_started | onboarding | restricted | active | rejected`
- `chargesEnabled`, `payoutsEnabled`: booleans
- `requirements`: `{ currentlyDue, pastDue, disabledReason }` or `null` if no Stripe account yet

**Front-end adaptations**

- Add a **Payments** or **Billing** settings section for Owners/Admins: “Connect Stripe”, show status/requirements, CTA to open onboarding or Stripe dashboard link.
- For Office role: allow **viewing** status (per backend) but not onboarding/dashboard where forbidden—handle **403** from those endpoints gracefully.

### Invoice payment helpers

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/invoices/:invoiceId/checkout-session` | **Admin, Owner, or Office.** Returns `{ url, sessionId }`. Open `url` for Stripe Checkout (**destination charge** on the company’s connected account). Only for invoices in **`unpaid`** or **`overdue`**. Errors with **400** if Stripe payouts/charges aren’t enabled for the company (`stripeChargesEnabled`). |
| `POST` | `/invoices/:invoiceId/charge-card-on-file` | Charges the **saved** card for that invoice’s client (off-session PaymentIntent). Response is a discriminated union—see below. |

**Charge card-on-file response**

- Success: `{ "status": "succeeded", "paymentIntentId": "..." }`
- Needs customer action / SCA recovery: `{ "status": "requires_action", "message": "...", "checkoutRecoveryNeeded": true }`

**Front-end UX**

- Show **“Pay with Checkout”** (or similar) when `chargesEnabled` is true and invoice is unpaid/overdue.
- Show **“Charge card on file”** only when the **client** has a default payment method (use client payload from your existing client-detail API—or add UI that checks cached `cardOnFile*` fields if exposed).
- If `requires_action`, show the returned `message` and offer **“Send pay link”** / open Checkout via `checkout-session` for that invoice.

### Save card (staff-initiated, company app)

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/payments/clients/:clientId/setup-checkout` | **Admin, Owner, or Office** for clients in their company. Returns `{ url }` for Stripe Checkout in **setup** mode on the connected account. Email the URL to the client or open it in a new tab from an internal tool. |

**Front-end adaptations**

- On **client detail**, optional action: **“Send / open link to save card”** gated on Connect + `stripeChargesEnabled`.

---

## Invoice & client payloads the UI should understand

Staff **`GET /invoices/:invoiceId`** returns the full `Invoice` entity from Prisma. New or payment-related fields worth surfacing:

| Field | Meaning |
| --- | --- |
| `paidAt` | When the invoice was marked paid (Stripe webhook or manual). |
| `invoicePaymentSource` | `card` \| `manual_card_on_file` \| `external` \| `null` — **how** it was paid (approximate semantics). **`external`** = marked paid manually in-app (no Stripe webhook for that transition). |
| `stripeCheckoutSessionId`, `stripePaymentIntentId`, `stripeChargeId` | Debugging / support (optional display). |
| `refundedAt`, `refundStatus` | Present if refunds are surfaced (backend tracks refund state). |

**Client model** additions (when you fetch clients for detail screens):

| Field | Meaning |
| --- | --- |
| `stripeCustomerId` | Internal; optional display. |
| `defaultStripePaymentMethodId` | If set, card-on-file charging is possible. |
| `cardOnFileLast4`, `cardOnFileBrand`, `cardOnFileExp` | Display-only cache for UI. |

**Company `preferences.paymentsPreferences`**

| Field | Default | Meaning |
| --- | --- | --- |
| `allowCardOnFile` | `true` | When true, Checkout for invoice payments uses `setup_future_usage: 'off_session'` so Stripe can save the card for later charges (subject to Stripe rules). |
| `applicationFeeBps` | `0` | Optional platform fee in basis points for this company. |

Use **`GET /payments/connect/status`** to drive whether payment CTAs appear; optionally combine with company preferences editors if you add UI for `paymentsPreferences`.

---

## Manual “mark invoice paid”

Existing **`PATCH /invoices/status`** behavior: transitioning to **`paid`** sets **`paidAt`** and **`invoicePaymentSource: external`** (see `src/use-cases/update-invoice-status.ts`).

**Front-end**: On success, refresh invoice detail; optionally show badge “Paid externally” vs “Paid via card” based on `invoicePaymentSource`.

---

## Client portal API (portal JWT — **no** user session)

Two steps: **request link** (public) → **exchange token** (public) → call portal routes with **portal access token**.

### 1. Request magic link (unauthenticated)

`POST /api/v1/client-portal/request-link`

```json
{ "email": "client@example.com", "invoiceId": "<optional>" }
```

- Response: **`{ "ok": true }`** always (mitigates email enumeration).
- Backend sends email with `${CLIENT_PORTAL_BASE_URL}/auth?token=<one_time_token>`.

**Front-end**: If you expose a **“Email me a login link”** form on the portal marketing page, call this endpoint with the client’s email (and optionally invoice id to aid routing).

### 2. Exchange one-time token (unauthenticated)

`POST /api/v1/client-portal/exchange-token`

```json
{ "token": "<raw token from query string>" }
```

- Success **`200`**: `{ "accessToken": "<jwt>", "expiresIn": "<string e.g. 30m>" }` (`expiresIn` matches server `CLIENT_PORTAL_JWT_EXPIRES_IN`).
- **`404`**: `{ "message": "Invalid or expired link." }`

**Front-end `/auth` route**

1. Read `token` from query.
2. `POST` exchange-token.
3. Store `accessToken` (memory + `sessionStorage`, or HTTP-only cookie if you add cookie-setting—backend **accepts** `Authorization: Bearer` **or** cookie name **`clientPortalToken`**).

### 3. Authenticated portal routes

Attach on every request:

```http
Authorization: Bearer <accessToken>
```

(Alternatively set cookie `clientPortalToken` to the JWT; the middleware reads either.)

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/client-portal/me` | `{ client, company, cardOnFile: { last4, brand, exp } }` |
| `GET` | `/client-portal/invoices` | `{ invoices: [{ id, invoiceNumber, status, issuedDate, dueDate, total, paidAt }] }` |
| `GET` | `/client-portal/invoices/:invoiceId` | Full invoice summary for portal (amounts, line items, notes, `paidAt`, etc.) — **PDF is separate** below. |
| `GET` | `/client-portal/invoices/:invoiceId/pdf` | **Binary PDF** (`application/pdf`): trigger download or open blob URL. |
| `POST` | `/client-portal/invoices/:invoiceId/checkout-session` | Same as company flow: `{ url, sessionId }`, client-scoped. |
| `POST` | `/client-portal/payment-method/setup-session` | `{ url }` — Checkout **setup** to add/update saved card on the connected account. |
| `DELETE` | `/client-portal/payment-method` | **204** — detaches saved method and clears cached display fields server-side when applicable. |

**401** `{ "message": "Unauthorized" }` when JWT missing, expired, wrong `scope`, or invalid.

---

## Pages / flows to implement (checklist)

### Company app

- [ ] **Settings → Payments**: Connect onboarding (`/payments/connect/onboard`), status polling (`/payments/connect/status`), “Open Stripe dashboard” (`/payments/connect/dashboard-link`).
- [ ] **Invoice detail** (and list where useful): conditional **Pay with Checkout** (`POST …/checkout-session`), **Charge card on file** with handling for `requires_action`.
- [ ] **Client detail**: optional **Save card link** (`POST /payments/clients/:clientId/setup-checkout`).
- [ ] **Invoice detail / list**: show **`paidAt`**, **`invoicePaymentSource`**; distinguish external vs card rails.
- [ ] **Checkout return pages**: success (with `{CHECKOUT_SESSION_ID}`), cancel—for both invoice payment and setup-mode flows—matching backend URL config.

### Client portal SPA (magic link)

- [ ] **`/auth`**: consume `?token=` → exchange → store JWT → redirect to dashboard.
- [ ] **Dashboard**: `GET /me`, list invoices, invoice detail.
- [ ] **Pay**: redirect to Checkout URL from `…/checkout-session`.
- [ ] **PDF**: fetch `…/pdf` as blob or open in new tab.
- [ ] **Payment method**: show `cardOnFile` from `me`; buttons for setup-session URL and DELETE to remove card.

---

## Optional: aligning with transactional email buttons

Outbound emails now include Stripe Checkout “Pay invoice” and **View online** links built on the backend (using `CLIENT_PORTAL_BASE_URL` and checkout session helpers). Keeping your front-end portal routes aligned with **`/auth?token=`** avoids broken magic links.

---

## Quick reference — new routes

```
POST   /api/v1/payments/connect/onboard
GET    /api/v1/payments/connect/status?companyId=
POST   /api/v1/payments/connect/dashboard-link
POST   /api/v1/payments/clients/:clientId/setup-checkout

POST   /api/v1/invoices/:invoiceId/checkout-session
POST   /api/v1/invoices/:invoiceId/charge-card-on-file

POST   /api/v1/client-portal/request-link          (public)
POST   /api/v1/client-portal/exchange-token           (public)
GET    /api/v1/client-portal/me                       (portal JWT)
GET    /api/v1/client-portal/invoices                 (portal JWT)
GET    /api/v1/client-portal/invoices/:invoiceId      (portal JWT)
GET    /api/v1/client-portal/invoices/:invoiceId/pdf(portal JWT)
POST   /api/v1/client-portal/invoices/:invoiceId/checkout-session (portal JWT)
POST   /api/v1/client-portal/payment-method/setup-session         (portal JWT)
DELETE /api/v1/client-portal/payment-method                         (portal JWT)
```

---

## Naming note (schema vs older plan wording)

The Prisma enum is **`invoicePaymentSource`** (values: `card`, `manual_card_on_file`, `external`). Older planning docs sometimes said `paymentMethod`; when binding types from the API, use **`invoicePaymentSource`**.

For webhook event lists and Stripe Dashboard setup, see `docs/STRIPE_WEBHOOKS.md`.
