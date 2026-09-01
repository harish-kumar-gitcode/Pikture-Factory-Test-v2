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
| All services | `/services` |
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
