# Scaling and performance (high concurrency)

This app is built to support many applicants and multiple schools using the system at the same time. For very large scale (e.g. ~1,000,000 concurrent users), both **front-end** and **backend/infrastructure** need to be considered.

## Front-end optimizations (in this codebase)

- **Debounced search** – Students list search and filter use a 250 ms debounce so filtering does not run on every keystroke, reducing work during typing.
- **Items per page cap** – Students table pagination is capped at 100 items per page so the UI never tries to render thousands of rows at once.
- **Lazy-loaded admin pages** – Admin sections (Dashboard, Students, Programmes, Classes, Houses, Logs, Users, Settings, Roles & Permissions, Messages, Transactions, Profile) are loaded with `React.lazy()` and `<Suspense>`, so the initial bundle is smaller and each page loads on demand.
- **Data isolation** – Data is scoped by school and admission (e.g. `formSettings_${schoolId}_${admissionId}`, `applicationData_${schoolId}_${indexNumber}`) so each school only works with its own data and payloads stay relevant.

Optional future improvement: virtualize the students table (e.g. `@tanstack/react-virtual`) so only visible rows are in the DOM when showing large page sizes.

## Backend and infrastructure (for ~1M users)

To achieve “bandwidth very fast” and support ~1,000,000 users at the same time:

1. **Backend scaling** – Run multiple app instances behind a load balancer; scale horizontally based on CPU, memory, and request rate.
2. **Database** – Use connection pooling, read replicas for heavy read paths, and indexes on hot columns (e.g. school id, admission id, index number, status, created_at). Consider sharding by school or region if a single DB becomes a bottleneck.
3. **CDN** – Serve static assets (JS, CSS, images) from a CDN to reduce origin load and latency.
4. **Caching** – Cache frequently read data (e.g. school/admission config, form settings) in Redis or similar; use short TTLs where freshness matters.
5. **Rate limiting and queues** – Protect APIs with rate limits; offload heavy or batch work (e.g. bulk uploads, reports) to queues and background workers.

These backend/infrastructure pieces are outside this repo but are necessary for very high concurrency and fast bandwidth at scale.
