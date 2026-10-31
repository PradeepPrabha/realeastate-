# TN HOMES – Frontend (Phase 2–3, 6–8 UI complete)

React 18-compatible stack: **React 19 · TypeScript · Vite · Tailwind CSS 3.4 · React Router · TanStack Query · React Hook Form + Zod · Axios · Recharts · Framer Motion**.

## Quick start
```bash
npm install
cp .env.example .env.local     # optional – defaults to mock mode
npm run dev                    # http://localhost:5173
npm run build                  # type-check + production build
npm test                       # 16 unit/API tests (Vitest)
```

## Demo accounts (mock mode only)
| Role | Email | Password |
|---|---|---|
| Admin | admin@tnhomes.in | Admin@123 |
| Agent | agent@tnhomes.in | Agent@123 |
| Customer | customer@tnhomes.in | Customer@123 |

Data lives in your browser's `localStorage` (key `tnh_mock_db_v1`). Admin → Settings → *Reset demo data* restores the seed.

## Mock API vs. Laravel
`src/mock/adapter.ts` is an Axios adapter that implements the **same `/api/v1` contract** the Laravel backend will expose
(auth, properties, customer, agent, admin, CMS, notifications, reports, settings).
Set `VITE_USE_MOCK=false` and `VITE_API_URL=…` and the UI talks to Laravel with **no component changes**.

Contract notes for the backend (Phase 4–5):
* Success: `{ "data": … }`. Paginated: `{ "data": [...], "meta": { page, perPage, total, lastPage, facets? } }` (Laravel API Resources).
* Validation errors: HTTP 422 `{ "message", "errors": { field: [msg] } }`. 401 → UI logs out. 403 → forbidden screen.
* Auth: `Authorization: Bearer <Sanctum token>`.
* Property visibility rule: public only if `listing = active` and (`verification = verified` when `requireVerification` setting is on).
* Extra endpoints used by the UI beyond the master prompt list: `GET /properties/map`, `POST /properties/compare`, `GET /stats`, `GET /settings/public`, `GET /faqs`, `GET /testimonials`, `GET /banners`, `POST /contact`, `POST /newsletter`, `POST /enquiries`, `POST /sell-rent-requests`, `GET/POST/DELETE /customer/alerts`, `PATCH /customer/appointments/{id}`, `GET /notifications`, `POST /notifications/read-all`, `PATCH /notifications/{id}/read`, `PUT /auth/profile`, `PUT /auth/password`, `GET /agent/reports`, `POST /agent/appointments`, `POST /admin/leads/{id}/assign`, and generic `GET/POST/PUT/DELETE /admin/{resource}` for users, agents, categories, locations, projects, blogs, banners, reviews, payments, enquiries, leads, appointments, sell-rent-requests, roles, media, notifications, faqs (+ read-only `audit-logs`).

## Structure
```
src/
  components/{common,layout,property,forms,dashboard}
  pages/{public,auth,customer,agent,admin}
  services/ (http.ts, api.ts)   mock/ (seed, db, adapter)
  context/ hooks/ types/ utils/ routes/ tests/
```

## Security notes
Route guards are UX only; the mock adapter (and the real API) re-check role and record ownership on every request. No secrets are stored in the frontend. File uploads are validated by type/size on the client and must be re-validated on the server. Supporting documents are uploaded to private storage by the backend (the demo only collects them).

## Known limitations / next phases
* Backend (Laravel/MySQL), real file storage, queues, email/WhatsApp, Razorpay and Turnstile are Phase 4–10.
* Property map view is a coordinate overview; the detail page uses an embedded Google Map. Add `VITE_GOOGLE_MAPS_KEY` + Maps JS for a full interactive map.
* Tamil is applied to navigation/hero text only; more strings can be added in `src/utils/i18n.ts`.
* Sitemap/robots/SSR prerendering (SEO Phase 10) are not yet generated – meta tags, canonical URLs and JSON-LD are set client-side.
"# realeastate-" 
