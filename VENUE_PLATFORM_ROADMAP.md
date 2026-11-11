# Venue Management Platform: phased implementation plan

This roadmap translates the Venue Management Platform PRD into incremental releases for the existing venue area in this application. Each phase should be reviewed against current UI and API support before adding duplicate features.

## Dashboard amendment

The venue dashboard is the daily operations landing page. It should answer, in order:

1. What needs my attention? Pending requests and quick actions.
2. What is happening today? Bookings grouped by space with status and time.
3. What is available? Current space load and a route to the calendar.
4. How is the venue performing? Upcoming and confirmed booking counts, outstanding balance, booking trends, source/status breakdown, recent activity, and monthly collection.

Keep values sourced from the venue dashboard API; do not show fabricated totals. “Total venues” is not meaningful for a venue-scoped account unless multi-venue management is supported for that role. Add dashboard date filters and additional KPIs after the API exposes consistent period-aware metrics.

## Delivery phases

### Phase 1 — Core venue operations

- Confirm authentication, venue roles, venue profile, spaces, booking records, and calendar behavior already present in the application.
- Complete client records and booking lifecycle states; ensure every booking belongs to a client and at least one space.
- Enforce availability conflicts for active requests and confirmed bookings, including setup/teardown buffers and manual blocks.
- Keep the dashboard focused on pending work, today’s schedule, space load, core booking KPIs, and operational trends.
- **Exit criteria:** a venue manager can configure spaces, review a request, prevent a conflicting reservation, and see the resulting schedule/dashboard state.

### Phase 2 — Commercial workflow

- Complete quote creation, revisions, expiry, client response, contract documents/status, invoices, payments, and refunds.
- Keep every financial adjustment traceable; calculate balances from successful transactions and adjustments.
- Connect quote acceptance and required deposits to booking confirmation rules.
- **Exit criteria:** a booking can move from quote through agreement and payment to confirmation with an auditable balance history.

**Progress:** Versioned quotations, client responses, payment recording, balance reporting, deposit-gated confirmation, refunds, and auditable payment voids are implemented in the current worktree. Invoices and contracts now have persistent numbered records and server-generated PDFs tied to an accepted quote; clients receive secure document links, and signed contracts can be uploaded and retained. Next Phase 2 review should verify migrations and mail configuration in the target environment, then cover resend/reissue rules, configurable templates/payment instructions, refunds in receipt exports, and financial acceptance criteria before moving to Phase 3.

### Phase 3 — Event preparation and operations

- Create an event workspace linked to each confirmed booking.
- Add event schedules, staff assignments, resource allocations, tasks, and readiness checklists.
- Enforce staff schedule and resource quantity conflicts; record authorized overrides.
- **Exit criteria:** an event manager can prepare an event, identify blockers, and close out completed operational tasks.

**Progress:** Confirmed bookings now open event workspaces with a default required checklist, readiness calculation, event schedule, staff assignments and attendance, resource allocation/return tracking, and damage/unavailable quantity reporting. Staff overlap checks include setup/teardown buffers; venue admins can record a reason when overriding a conflict. Inventory allocations check overlapping event reservations. The event workspace UI is available to venue admins and venue staff. Migration application and environment verification remain outstanding.

### Phase 4 — Guest, access, and incident operations

- Add guest lists/import, check-in identifiers, VIP records, parking zones/passes, and incident reporting.
- Apply event-scoped access permissions and retain attendance/incident history.
- **Exit criteria:** operations staff can verify guests and vehicles and record event incidents against the correct event.

### Phase 5 — Reporting, notifications, and integrations

- Add period/venue/event filters, exportable operational and financial reports, and role-aware dashboards.
- Add configurable in-app/email/SMS notification events and delivery preferences.
- Evaluate external calendar, payment, messaging, and accounting integrations after core workflows stabilize.
- **Exit criteria:** managers can review trusted operational/financial outcomes and users receive actionable, configurable alerts.

## Working approach

Deliver one phase at a time. For each phase, inspect the existing frontend and backend, define API/data gaps, implement the smallest complete workflow, then review its acceptance criteria before starting the next phase. Prioritize the availability and booking rules because later commercial and event workflows depend on reliable reservations.

## Current dashboard status

The venue dashboard currently includes a venue setup state, pending-request link, today’s bookings grouped by space, current space load, and revenue summary. The dashboard amendment adds direct booking/space/payment KPIs and restores the existing booking trend, source, status, and recent-activity panels. Dashboard-wide period filters, separate event metrics, venue utilization calculations, and role-specific multi-venue totals depend on API and product support and remain later data/API work.
