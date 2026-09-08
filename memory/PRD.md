# PRD — IT Ticketing & KPI Management System (ServiceOps)

## Original problem statement
Web app to manage IT tickets/complaints, technicians, SLA, and automatically compute individual & team KPI. Flow: Customer/User → Ticket → Assignment → Teknisi bekerja → SLA Tracking → Resolution → Customer Rating → KPI Calculation → Dashboard & Report.

## Architecture
- **Backend**: FastAPI + MongoDB (motor). Auth via JWT httpOnly cookies (12h access, 7d refresh). All routes under `/api`.
- **Frontend**: React 19 + Tailwind + Shadcn UI + Recharts + Phosphor Icons. Cookie-based auth via axios `withCredentials`.
- **Storage**: MongoDB collections: users, tickets, ticket_activities, categories, settings (sla_rules, kpi_config, integrations), counters (ticket numbering), audit_logs.
- **Fonts**: Work Sans (display) + IBM Plex Sans (body) + IBM Plex Mono.

## User personas
- Admin: full system access.
- Manager: ticket overview, KPI/SLA configuration, reports.
- Supervisor: assign tickets, monitor team performance.
- Technician: work on assigned tickets, update status, resolve.
- Customer: create tickets, view own tickets, rate resolved ones.

## Core requirements (static)
- Ticketing (create/assign/update status/resolve/reopen/rate) with priority-based SLA & weighted points (Critical=5, High=3, Medium=2, Low=1).
- SLA rules configurable per priority via Settings.
- KPI configurable weights (default: SLA 25, Productivity 20, Response 15, Resolution 15, Reopen 10, Rating 10, Docs 5) with performance thresholds (Excellent ≥90, Good ≥80, Fair ≥70).
- Dashboard with cards + charts (per month, by priority, by category, by technician, top performers, aging).
- Reports: CSV + PDF export (KPI & Tickets).
- Audit log for every critical action.
- RBAC on every endpoint & UI route.

## What's been implemented (2026-02)
- ✅ Auth (JWT cookies, login by email OR username), 5 roles.
- ✅ 8 demo accounts + 15 seeded tickets across statuses.
- ✅ Full ticket lifecycle (create, assign, status change, resolve, close, reopen, rate).
- ✅ SLA computation (response, resolution, aging, indicator: on_track/warning/violated/met).
- ✅ KPI engine with 7 configurable components + weighted per-priority points.
- ✅ Dashboard w/ 10 KPI cards + 5 charts + aging buckets + top-3 performers.
- ✅ Tickets list with search/filter/pagination, ticket detail with activity timeline.
- ✅ Attachments (base64 with client-side image compression to <600KB @ 1920px).
- ✅ Categories, Users, Customers admin pages.
- ✅ Settings: SLA rules, KPI config (with weight-sum=100 validation), Telegram+WhatsApp placeholder fields.
- ✅ Reports: CSV + PDF export via ReportLab.
- ✅ Audit log page + backend audit for all critical actions.
- ✅ Testing agent: 34/34 backend tests pass, all frontend flows validated.

## Deferred / Backlog
- P1: Actually send Telegram/WhatsApp notifications when tokens are set (webhook to bot API / gateway).
- P1: File preview modal / lightbox for image attachments.
- P2: Excel (xlsx) export.
- P2: Bulk actions on tickets (mass assign, mass close).
- P2: Custom date-range picker (Shadcn calendar) on Reports instead of native.
- P2: KPI period snapshots (monthly cron persisting scores for trend line).
- P3: SLA rules per category (currently priority-only).
- P3: Team-level KPI aggregation view.

## Test credentials
See `/app/memory/test_credentials.md`.
