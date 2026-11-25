# Pikture Factory — Full-Stack Platform (Next.js + MongoDB + Cloudinary)

A production-structured rebuild of the Pikture Factory management system: public site, Admin Panel,
and Vendor Panel, built on Next.js (App Router, JSX), Tailwind CSS, MongoDB/Mongoose, and Cloudinary.

> The Client dashboard is intentionally left as a stub (`/client/dashboard`) for now — everything else
> (homepage, gallery, services, admin, vendor) is fully wired to a real backend.

## 1. Install

```bash
npm install
```

## 2. Environment variables

Copy `.env.example` to `.env` and fill in:

```
MONGODB_URI=            # MongoDB Atlas or local connection string
JWT_SECRET=              # any long random string
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
EMAIL_USER=pikturefactory@gmail.com
EMAIL_PASS=               # a Gmail App Password (not your normal password)
NEXT_PUBLIC_APP_URL=http://localhost:3000
SEED_ADMIN_NAME=Admin User
SEED_ADMIN_EMAIL=admin@pikturefactory.com
SEED_ADMIN_PASSWORD=changeme123
```

**Gmail App Password:** enable 2-Step Verification on the Google account, then generate an
App Password at https://myaccount.google.com/apppasswords — use that as `EMAIL_PASS`.

## 3. Create the first Admin login

```bash
npm run seed:admin
```

This reads `SEED_ADMIN_*` from `.env` and creates one Admin document. Log in at `/login/admin`,
then change the password immediately from **Settings**.

## 4. Run

```bash
npm run dev
```

- Public site: `http://localhost:3000`
- Admin login: `/login/admin`
- Vendor login: `/login/vendor`
- Client login: `/login/client`
- Vendor sign-up (public): `/vendor-apply`

## Routes overview

| Area | Route |
|---|---|
| Homepage | `/` |
| Full gallery | `/gallery` |
| Wedding & Events | `/wedding-events` |
| Corporate Events | `/corporate-events` |
| Collections and cart | `/packages`, `/cart` |
| Legacy services URL | `/services` (redirects to collections) |
| Admin login | `/login/admin` → `/admin/dashboard`, `/admin/enquiries`, `/admin/clients`, `/admin/vendors`, `/admin/gallery`, `/admin/payments`, `/admin/tickets`, `/admin/settings` |
| Vendor apply (public wizard) | `/vendor-apply` → `/vendor-apply/under-review` |
| Vendor login | `/login/vendor` → `/vendor/dashboard`, `/vendor/projects/[id]`, `/vendor/portfolio`, `/vendor/payments`, `/vendor/profile` |
| Client login | `/login/client` → `/client/dashboard` (stub for now) |

## How the core flows work

**Vendor onboarding:** anyone can apply at `/vendor-apply` (multi-step, progress bar, uploads go
straight to Cloudinary). New applications show up under **Admin → Vendors → New Applications**
with a notification badge in the sidebar. Approve → vendor gets a login email with credentials.
Reject → vendor moves to **Rejected / Waitlist**, reachable from the Vendors page, and can be
reconsidered any time.

**Client creation:** Admin creates a client from **Admin → Clients → Add Client** (or converts an
Enquiry directly). A login is generated automatically and emailed from `pikturefactory@gmail.com`.

**Gallery approval:** vendors upload media against an assigned project; it lands in
**Admin → Gallery Approval** as `pending`. Approving requires picking a category and immediately
makes it live on the public `/gallery` page and homepage. The uploading vendor's ID is attached in
the background and is never exposed publicly — only inside the Admin panel.

**Lead capture popup:** on the public gallery, opening any image and waiting ~3 seconds surfaces a
"Get a free quote" form. Submissions are stored as **Leads** with the image preview and the
vendor's code attached, for admin follow-up (currently viewable via `/api/leads` — wire into a UI
tab any time).

**Auth:** three fully separate login routes/collections (Admin, Vendor, Client), JWTs in an
httpOnly cookie, and `middleware.js` gates `/admin`, `/vendor`, and `/client` by role.

## Project structure

```
app/            Next.js App Router — pages + /api route handlers
components/     Reusable UI (admin, vendor, home, gallery, ui/)
lib/            mongodb.js, cloudinary.js, auth.js, mailer.js, codes.js, servicesData.js
models/         Mongoose schemas (Admin, Vendor, Client, Enquiry, Project, GalleryItem, Ticket, Lead)
scripts/        seedAdmin.js
middleware.js   Role-based route protection (Edge runtime, via `jose`)
```

## Notes for going to production

- **Cloudinary uploads:** media uploads are signed by `/api/cloudinary/signature`, then sent
  directly from the browser to Cloudinary. This means the media never enters a Vercel function.
  The helper uses Cloudinary's chunked upload protocol for files over 100 MB (20 MB chunks),
  supporting 500 MB+ and 1 GB videos within your Cloudinary plan limits. Keep
  `CLOUDINARY_API_SECRET` server-only; it must never have a `NEXT_PUBLIC_` prefix.

- Replace the demo image URLs (Unsplash / pravatar) in `lib/servicesData.js` and testimonial
  avatars with real assets once available.
- Add rate limiting / captcha to the public `/api/enquiries`, `/api/leads`, and `/api/vendors/apply`
  routes before launch.
- The Client dashboard (`/client/dashboard`) is a stub — happy to build it out to match the Admin/
  Vendor panels in the next phase, reusing the same models (`Client`, `Project`, `Ticket`) that are
  already fully wired on the backend.


## 6. Google Drive private delivery workspace

Pikture Factory can use the client's `pikturefactory@gmail.com` Google Drive as the private storage layer while
keeping Google Drive completely hidden from the client-facing gallery.

### Google Cloud setup

1. In Google Cloud Console, create/select a project and enable the **Google Drive API**.
2. Create an **OAuth 2.0 Client ID** with application type **Web application**.
3. Add this exact redirect URI:
   `https://YOUR-DOMAIN/api/admin/google-drive/callback`
   (for local development: `http://localhost:3000/api/admin/google-drive/callback`).
4. Add `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET` to the server environment. Optionally set
   `GOOGLE_DRIVE_REDIRECT_URI` if the callback URL is different from the default.
5. Log into the Admin panel → **Settings** → **Connect Google Drive**, and authorize the
   `pikturefactory@gmail.com` account. The refresh token is stored server-side in MongoDB; it is never exposed
   to vendors or clients.

### Delivery flow

- When a vendor marks a shoot **Completed**, the app automatically creates a private event folder named like
  `30 Dec 2026_VN-266_Bride & Groom`, with **RAW** and **EDITED** subfolders.
- The vendor sees two upload buttons in the project panel and receives the same links by email.
- Vendors can upload full-resolution RAW/edited files directly into Drive; the Cloudinary portfolio limits do not
  apply to these Drive folders.
- Admin → **Media Library** → choose an event → **Sync Drive** imports the files into the app's private media
  index without copying the files out of Drive.
- Admin selects individual files for client delivery and can rename their album/folder label (e.g. `Haldi`,
  `Wedding`, `Reception`).
- Clients see only the curated files in their private event gallery. They can select favourites and download
  them from the client panel; the download is streamed through the authenticated app and logged for Admin.
- Admin can see client download activity from the bell notification / **Media Library**.

### Upload size limits

The vendor portfolio/project Cloudinary uploader enforces **10MB maximum per image** and **200MB maximum per
video** and shows a clear `File size too large` message before an oversized file is uploaded. The Drive
workspace is intentionally unlimited by the app so the client can use their available Google Drive storage.

### Existing data

The existing `GalleryItem` / Cloudinary public-gallery workflow remains intact. The new Drive delivery workflow
uses separate `ProjectMedia`, `MediaDownload`, and `DriveIntegration` collections plus additional optional
`Project.drive` fields, so existing projects, vendor portfolios, enquiries, payments, clients, and gallery items
are preserved.

## Portal UI refresh

The vendor, admin and client workspaces now use a more structured professional dashboard system with grouped/collapsible navigation, larger typography, clearer hierarchy, premium cards, quick actions and dedicated Data & Insights views. The vendor and admin navigation also expose a dedicated Projects workspace, while Payments is presented as Finance in the interface.

Vendors can open **How it works** from the sidebar, choose a preferred onboarding date/time and send an onboarding request. The request is stored and the configured admin email is notified; the UI confirms that the team will contact the vendor within 6–8 hours.

The homepage has intentionally been left unchanged.

## Final portal polish (September 2026)
- Desktop admin/vendor sidebars are fixed to the viewport; only their navigation region can scroll when needed.
- Admin has no floating Need Help widget; vendor support remains available and WhatsApp messages include the vendor ID.
- Admin “Search workspace” is functional with clients, vendors, projects and enquiries.
- New clients and newly approved vendors receive sequential CL-001 / VN-001-style codes (existing codes are preserved).
- Gallery image quote requests are mirrored into Enquiries with the reference image URL and vendor code.
- Public enquiry, gallery quote, vendor application and client creation forms validate required contact data.
- Homepage hero positioning uses “Managed Visual Production Studio” instead of “Photography & Film Agency”.

## Updated public package store

The customer-facing catalog is maintained in `lib/catalog.js` using the supplied package PDF. The existing admin package CRUD is retained for legacy records, but does not control this new catalog. Wedding and custom-event pricing is enquiry-only where the PDF gives no wedding-specific rate. The PDF's pre-wedding rates take precedence over illustrative rates in the request. Unpriced extras are quoted separately; the subtotal excludes them. Cart selections use a new browser storage key to avoid carrying outdated package prices.

Package enquiries are validated and priced server-side, saved to MongoDB in the existing Enquiry collection, and then redirected to the existing WhatsApp number. Admin → Enquiries displays event type and budget. WhatsApp opens a prefilled message; the customer must still send it. No payment is collected.

For an existing deployment, reuse its private `.env` from the original project or hosting environment. Do not commit secrets. The ZIP intentionally excludes `.env` and `.git`. Run `npm ci`, `npm run build`, then test a package enquiry against a test MongoDB instance before deployment. Existing admin accounts need not be reseeded.

Validation performed: JS/JSX syntax parsing and catalog assertions. Full Next.js build and live MongoDB/WhatsApp integration were not tested because dependencies were unavailable in the offline cache.
