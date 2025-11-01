# Materials (Topics & Files)

A minimal Next.js app to distribute course materials with topics and per-topic files. Admins can add/delete; students can download and view PDFs in-browser.

## Features
- Topics (create/delete)
- Materials per topic (upload/delete)
- Upload via Vercel Blob signed URLs
- Metadata stored in Vercel Postgres
- Admin login via password (cookie-based JWT)
- PDF viewer (pdf.js)

## Tech
- Next.js (App Router) on Vercel
- Vercel Postgres (@vercel/postgres)
- Vercel Blob (@vercel/blob)
- jose (JWT for admin session)

## Environment Variables
Create `.env.local` with:

```
# Admin login password
ADMIN_PASSWORD=change-me

# JWT signing secret (random long string)
AUTH_SECRET=your-long-random-secret

# Database connection
# If using Marketplace (Neon, Prisma Postgres, etc.) you'll get DATABASE_URL
DATABASE_URL=postgres://...
# If using Vercel Postgres, you may see POSTGRES_URL
POSTGRES_URL=postgres://...

# Vercel Blob token (set by Vercel integration)
BLOB_READ_WRITE_TOKEN=...  
# or VERCEL_BLOB_READ_WRITE_TOKEN depending on your setup
```

On Vercel, DATABASE_URL comes from Marketplace providers (e.g. Neon). POSTGRES_URL may come from Vercel Postgres. Add `ADMIN_PASSWORD` and `AUTH_SECRET` manually. For Blob, create a Store and a Read/Write token and add it as `BLOB_READ_WRITE_TOKEN`.

## Local Development

1) Install deps

```bash
npm install
```

2) Provide `.env.local` with the variables above. For local Postgres, you can use Vercel Postgres with the dev connection string.

3) Run

```bash
npm run dev
```

Open http://localhost:3000

- Admin login: /admin/login (use your `ADMIN_PASSWORD`)
- Admin dashboard: /admin

## Deployment (Step-by-step)

1) Push this repo to GitHub.

2) Create a Vercel project
- Import your GitHub repo into Vercel
- Framework preset: Next.js

3) Add integrations
- Vercel Postgres → it will create `POSTGRES_URL` and related envs
- Vercel Blob → it will create blob envs (e.g., `BLOB_READ_WRITE_TOKEN`)

4) Add env variables
- `ADMIN_PASSWORD` → set a strong password
- `AUTH_SECRET` → long random string (>= 32 chars)

5) Deploy
- Trigger a deployment on Vercel (it will install & build automatically)

6) Initialize
- Open your deployed app
- Go to /admin/login and sign in with your `ADMIN_PASSWORD`
- Create a topic, upload files. PDFs will have a “PDF 보기” link to the in-browser viewer.

## Notes
- Deleting a material also deletes the underlying Blob object.
- Files are public by default via Blob URL; if you need private downloads, route through a protected API that checks admin/student auth and streams the file.
- Middleware protects the /admin UI, and API routes also verify admin cookies.

## Future Enhancements
- Student authentication and access control per course
- Drag-and-drop reordering for topics and materials
- Preview images/thumbnails for non-PDF files
