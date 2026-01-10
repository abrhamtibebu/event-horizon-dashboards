---
name: Fix Broken Access Control - Admin Routes
overview: Add role-based access control middleware to all administrative endpoints to prevent privilege escalation. The main vulnerability is that organizer-level tokens can access admin routes like `/admin/organizers/{organizer}/events`. We'll add role middleware protection to all admin routes and add controller-level checks as defense in depth.
todos:
  - id: fix-admin-organizer-events-route
    content: Add role middleware to /api/admin/organizers/{organizer}/events route (line 583 in api.php)
    status: completed
  - id: protect-organizer-crud-routes
    content: Wrap organizer CRUD routes (index, store, destroy, contacts) in role:admin,superadmin middleware group (lines 565-571)
    status: completed
  - id: protect-admin-dashboard-route
    content: Add role middleware to /api/dashboard/admin route (line 607)
    status: completed
  - id: protect-change-role-route
    content: Add role middleware to /api/users/{user}/role route (line 608) - critical for preventing privilege escalation
    status: completed
  - id: protect-audit-logs-route
    content: Add role middleware to /api/audit-logs route (line 604)
    status: completed
  - id: add-controller-checks-organizer
    content: Add role verification checks in OrganizerController methods (adminOrganizerEvents, index, store, destroy, assignContacts) as defense in depth
    status: completed
    dependencies:
      - fix-admin-organizer-events-route
      - protect-organizer-crud-routes
  - id: add-controller-checks-dashboard
    content: Add role check in DashboardController::adminDashboard method
    status: completed
    dependencies:
      - protect-admin-dashboard-route
  - id: add-controller-checks-auth
    content: Add role check in AuthController::changeRole method to prevent privilege escalation
    status: completed
    dependencies:
      - protect-change-role-route
  - id: audit-all-admin-routes
    content: Review all routes with /admin/ prefix to ensure they have proper role protection
    status: completed
  - id: add-frontend-role-checks
    content: Add frontend role validation in OrganizerProfile.tsx and Organizers.tsx before making admin API calls (optional, for UX)
    status: completed
  - id: test-with-organizer-token
    content: Test all protected routes with organizer-level token - should return 403 Forbidden
    status: pending
    dependencies:
      - fix-admin-organizer-events-route
      - protect-organizer-crud-routes
      - protect-admin-dashboard-route
      - protect-change-role-route
      - protect-audit-logs-route
  - id: test-with-admin-token
    content: Test all protected routes with admin-level token - should work correctly
    status: pending
    dependencies:
      - fix-admin-organizer-events-route
      - protect-organizer-crud-routes
      - protect-admin-dashboard-route
      - protect-change-role-route
      - protect-audit-logs-route
  - id: verify-audit-logging
    content: Verify that unauthorized access attempts are properly logged in audit logs with IP, user agent, and route information
    status: completed
    dependencies:
      - add-controller-checks-organizer
---

# Fix Broken Access Control / Privilege Escalation Vulnerability

## Problem Analysis

The vulnerability exists because several administrative routes are protected only by `jwt.auth` middleware but lack `role:admin,superadmin` middleware. An organizer-level token can access these routes when they should be restricted to administrators only.**Primary Vulnerable Route:**

- `GET /api/admin/organizers/{organizer}/events` (line 583) - No role protection

**Additional Vulnerable Routes Identified:**

- `GET /api/organizers` (line 565) - Lists all organizers
- `GET /api/organizers/{organizer}/contacts` (line 566) - View organizer contacts
- `DELETE /api/organizers/{organizer}/contacts/{user}` (line 567) - Remove contacts
- `POST /api/organizers/{organizer}/contacts/{user}/primary` (line 568) - Set primary contact
- `DELETE /api/organizers/{organizer}` (line 569) - Delete organizer
- `POST /api/organizers` (line 570) - Create organizer
- `POST /api/organizers/{organizer}/contacts` (line 571) - Assign contacts
- `GET /api/dashboard/admin` (line 607) - Admin dashboard
- `POST /api/users/{user}/role` (line 608) - Change user role (privilege escalation risk)
- `GET /api/audit-logs` (line 604) - View audit logs

## Implementation Plan

### Phase 1: Fix Route-Level Protection

**File: `validity_backend/routes/api.php`**

1. **Fix the primary vulnerability** (line 583):
   ```php
         Route::get('admin/organizers/{organizer}/events', [OrganizerController::class, 'adminOrganizerEvents'])
             ->middleware('role:admin,superadmin');
   ```




2. **Protect organizer management routes** (lines 565-571):

Wrap these routes in a middleware group:

   ```php
         Route::middleware(['role:admin,superadmin'])->group(function () {
             Route::get('organizers', [OrganizerController::class, 'index']);
             Route::get('organizers/{organizer}/contacts', [OrganizerController::class, 'contacts']);
             Route::delete('organizers/{organizer}/contacts/{user}', [OrganizerController::class, 'removeContact']);
             Route::post('organizers/{organizer}/contacts/{user}/primary', [OrganizerController::class, 'setPrimaryContact']);
             Route::delete('organizers/{organizer}', [OrganizerController::class, 'destroy']);
             Route::post('organizers', [OrganizerController::class, 'store']);
             Route::post('organizers/{organizer}/contacts', [OrganizerController::class, 'assignContacts']);
         });
   ```



3. **Protect admin dashboard and role management** (lines 607-608):
   ```php
         Route::get('/dashboard/admin', [App\Http\Controllers\DashboardController::class, 'adminDashboard'])
             ->middleware('role:admin,superadmin');
         Route::post('/users/{user}/role', [AuthController::class, 'changeRole'])
             ->middleware('role:admin,superadmin');
   ```




4. **Protect audit logs** (line 604):
   ```php
         Route::get('audit-logs', [AuditLogController::class, 'index'])
             ->middleware('role:admin,superadmin');
   ```




### Phase 2: Add Controller-Level Defense in Depth

**File: `validity_backend/app/Http/Controllers/OrganizerController.php`**Add role checks at the beginning of admin methods:

1. **`adminOrganizerEvents` method** (line 504):
   ```php
         public function adminOrganizerEvents(Request $request, Organizer $organizer)
         {
             // Defense in depth: Verify admin role
             if (!in_array($request->user()->role, ['admin', 'superadmin'])) {
                 AuditLogController::log(
                     $request->user()->id,
                     'unauthorized_access_attempt',
                     'Organizer',
                     $organizer->id,
                     ['route' => 'admin/organizers/{organizer}/events', 'ip' => $request->ip()]
                 );
                 return response()->json(['error' => 'Forbidden: Admin access required'], 403);
             }
             
             // ... existing code ...
         }
   ```




2. **`index` method** (line 201):

Add similar check for listing all organizers.

3. **`store`, `destroy`, `assignContacts` methods**:

Add role verification checks.**File: `validity_backend/app/Http/Controllers/DashboardController.php`**Add role check to `adminDashboard` method.**File: `validity_backend/app/Http/Controllers/AuthController.php`**Add role check to `changeRole` method - this is critical as it allows privilege escalation.

### Phase 3: Audit All Admin Routes

**File: `validity_backend/routes/api.php`**Review all routes with `/admin/` prefix and ensure they have role protection:

- Line 583: `admin/organizers/{organizer}/events` - **FIX**
- Line 861: `admin/users/{user}/reset-password` - Already protected (line 860)
- Line 989-991: `admin/sales/*` - Already protected

### Phase 4: Enhance Logging

**File: `validity_backend/app/Http/Middleware/RoleMiddleware.php`**The middleware already logs unauthorized access attempts (lines 22-34). Verify that:

1. Logs are being written to the audit log table
2. Logs include sufficient detail for security monitoring
3. Consider adding rate limiting alerts for repeated unauthorized attempts

### Phase 5: Frontend Protection (Defense in Depth)

**Files:**

- `event-horizon-dashboards/src/pages/OrganizerProfile.tsx`
- `event-horizon-dashboards/src/pages/Organizers.tsx`
- `event-horizon-dashboards/src/lib/api.ts`

Add frontend role checks before making admin API calls:

```typescript
const { user } = useAuth();
if (!user || !['admin', 'superadmin'].includes(user.role)) {
    // Redirect or show error
    return;
}
```

**Note:** Frontend checks are for UX only - backend protection is mandatory.

## Testing Strategy

1. **Test with organizer token:**

- Attempt to access `/api/admin/organizers/3/events` - Should return 403
- Attempt to access `/api/organizers` - Should return 403
- Attempt to access `/api/dashboard/admin` - Should return 403
- Attempt to change user role - Should return 403

2. **Test with admin token:**

- All above routes should work correctly

3. **Verify audit logs:**

- Check that unauthorized access attempts are logged
- Verify log entries include IP, user agent, and route information

4. **Regression testing:**

- Ensure existing admin functionality still works
- Verify organizer endpoints (non-admin) still work for organizers

## Rollout Considerations

1. **No breaking changes for authorized users:** Admin and superadmin users will experience no changes
2. **Organizer users:** Will be denied access to admin routes (expected behavior)
3. **Frontend:** May need to handle 403 errors gracefully and redirect unauthorized users
4. **Monitoring:** Watch audit logs for unauthorized access attempts after deployment

## Files to Modify

1. `validity_backend/routes/api.php` - Add role middleware to vulnerable routes
2. `validity_backend/app/Http/Controllers/OrganizerController.php` - Add controller-level checks
3. `validity_backend/app/Http/Controllers/DashboardController.php` - Add role check
4. `validity_backend/app/Http/Controllers/AuthController.php` - Add role check to changeRole
5. `event-horizon-dashboards/src/pages/OrganizerProfile.tsx` - Add frontend role check (optional)
6. `event-horizon-dashboards/src/pages/Organizers.tsx` - Add frontend role check (optional)

## Risk Mitigation

- **Low risk:** Changes only add restrictions, don't remove functionality
- **Backward compatible:** Existing admin workflows remain unchanged