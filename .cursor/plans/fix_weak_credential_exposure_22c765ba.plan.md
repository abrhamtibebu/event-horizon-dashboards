---
name: Fix Weak Credential Exposure
overview: Remove hardcoded superadmin email from frontend code and implement strong password policies with stricter requirements for privileged accounts, including password rotation for admin/superadmin users.
todos:
  - id: remove-hardcoded-email
    content: Remove hardcoded superadmin email from frontend Users.tsx and replace with permission-based check
    status: completed
  - id: create-password-service
    content: Create PasswordValidationService with strong password requirements and role-based validation
    status: completed
  - id: add-password-tracking
    content: Add password_changed_at field to User model and create database migration
    status: completed
  - id: update-registration
    content: Update registration endpoint to use PasswordValidationService with role-based requirements
    status: completed
    dependencies:
      - create-password-service
  - id: update-password-reset
    content: Update password reset endpoint to use PasswordValidationService
    status: completed
    dependencies:
      - create-password-service
      - add-password-tracking
  - id: update-password-change
    content: Update password change endpoint to use PasswordValidationService and set password_changed_at
    status: completed
    dependencies:
      - create-password-service
      - add-password-tracking
  - id: add-password-expiration
    content: Add password expiration check (90 days) for privileged accounts in login endpoint
    status: completed
    dependencies:
      - add-password-tracking
  - id: create-permission-endpoint
    content: Create backend endpoint to check if user can create superadmin (replaces hardcoded email check)
    status: completed
  - id: update-frontend-permission
    content: Update frontend to use permission endpoint instead of hardcoded email check
    status: completed
    dependencies:
      - create-permission-endpoint
  - id: add-frontend-password-validation
    content: Add frontend password strength indicator and validation for better UX
    status: completed
    dependencies:
      - create-password-service
---

# Fix Weak Credential Exposure for Privileged Accounts

## Problem Analysis

**Current Vulnerabilities:**

1. **Exposed Superadmin Email**: The email `superadmin@validity.et` is hardcoded in frontend code (`event-horizon-dashboards/src/pages/Users.tsx:443`), making it publicly accessible in client-side JavaScript bundles.
2. **Weak Password Requirements**: All password validations only require minimum 6 characters with no complexity requirements:

   - Registration: `'password' => 'required|string|min:6|confirmed'`
   - Password update: `'new_password' => 'required|string|min:6|confirmed'`
   - Password reset: `'password' => 'required|string|min:6|confirmed'`

3. **No Special Requirements for Privileged Accounts**: Admin and superadmin accounts have the same weak password requirements as regular users.
4. **No Password Rotation**: No mechanism to enforce password expiration for privileged accounts.

## Implementation Plan

### Phase 1: Remove Hardcoded Superadmin Email from Frontend

**File: `event-horizon-dashboards/src/pages/Users.tsx`**

Replace the hardcoded email check with a backend-based permission check:

- Remove: `const canCreateSuperAdmin = isCurrentSuperAdmin && currentUser?.email === 'superadmin@validity.et';`
- Replace with: Check a backend endpoint or user permission flag that indicates if the current superadmin can create other superadmins
- Alternative: Use a permission-based approach where only the first superadmin (ID=1) can create other superadmins

**Changes:**

- Line 443: Remove hardcoded email comparison
- Lines 622, 999: Update conditional rendering to use permission-based check instead

### Phase 2: Create Password Validation Service

**File: `validity_backend/app/Services/PasswordValidationService.php`** (NEW)

Create a comprehensive password validation service with:

1. **Password Strength Validation:**

   - Minimum length: 8 characters for regular users, 12 characters for admin/superadmin
   - Complexity requirements:
     - At least one uppercase letter
     - At least one lowercase letter
     - At least one number
     - At least one special character
   - Check against common/weak passwords list (e.g., "password", "12345678", "qwerty", etc.)

2. **Role-Based Requirements:**

   - `validatePassword(string $password, string $role = 'attendee'): array` - Returns validation result with messages
   - Stricter requirements for `admin` and `superadmin` roles

3. **Password History Check** (optional for future):

   - Track password history to prevent reuse of recent passwords

**Key Methods:**

```php
public function validatePassword(string $password, string $role = 'attendee'): array
public function isCommonPassword(string $password): bool
public function meetsComplexityRequirements(string $password, string $role): bool
```

### Phase 3: Add Password Tracking to User Model

**File: `validity_backend/app/Models/User.php`**

Add field to track password changes:

- Add `password_changed_at` to `$fillable` array
- Add `password_changed_at` to `$casts` as `'datetime'`
- Add method: `isPasswordExpired(): bool` - Check if password is older than 90 days for privileged accounts

**Database Migration:**

- Create migration to add `password_changed_at` column to `users` table
- Set default value for existing users to current timestamp

### Phase 4: Update Registration Endpoint

**File: `validity_backend/app/Http/Controllers/AuthController.php`**

**Method: `register()`** (Line 16-84)

Changes:

- Replace `'password' => 'required|string|min:6|confirmed'` with custom validation using `PasswordValidationService`
- Set `password_changed_at` when creating user
- Apply role-based password requirements

**Example:**

```php
$passwordValidation = app(\App\Services\PasswordValidationService::class);
$role = $request->role ?? 'attendee';
$validation = $passwordValidation->validatePassword($request->password, $role);

if (!$validation['valid']) {
    return response()->json(['error' => $validation['message']], 422);
}
```

### Phase 5: Update Password Reset Endpoint

**File: `validity_backend/app/Http/Controllers/AuthController.php`**

**Method: `resetPassword()`** (Line 178-211)

Changes:

- Replace `'password' => 'required|string|min:6|confirmed'` with `PasswordValidationService`
- Get user role and apply appropriate requirements
- Set `password_changed_at` after successful reset

### Phase 6: Update Password Change Endpoint

**File: `validity_backend/app/Http/Controllers/UserController.php`**

**Method: `updatePassword()`** (Line 113-136)

Changes:

- Replace `'new_password' => 'required|string|min:6|confirmed'` with `PasswordValidationService`
- Get user role and apply appropriate requirements
- Set `password_changed_at` after successful update
- Check if password is expired for privileged accounts and require change

### Phase 7: Add Password Expiration Check for Privileged Accounts

**File: `validity_backend/app/Http/Controllers/AuthController.php`**

**Method: `login()`** (Line 87+)

Add check after successful authentication:

- If user is admin/superadmin and password is expired (>90 days), return special response indicating password change required
- Frontend should redirect to password change page

**Implementation:**

```php
if (in_array($user->role, ['admin', 'superadmin'])) {
    if ($user->isPasswordExpired()) {
        return response()->json([
            'token' => $token,
            'user' => $user,
            'password_expired' => true,
            'message' => 'Password has expired. Please change your password.'
        ], 200);
    }
}
```

### Phase 8: Create Backend Permission Endpoint

**File: `validity_backend/app/Http/Controllers/UserController.php`** or new `PermissionController.php`

Create endpoint to check if current superadmin can create other superadmins:

- `GET /api/permissions/can-create-superadmin`
- Logic: Only allow if current user is superadmin AND (user ID is 1 OR has special permission flag)
- This replaces the hardcoded email check in frontend

### Phase 9: Update Frontend to Use Permission Endpoint

**File: `event-horizon-dashboards/src/pages/Users.tsx`**

Changes:

- Remove hardcoded email check (line 443)
- Add API call to `/api/permissions/can-create-superadmin` endpoint
- Use response to set `canCreateSuperAdmin` state
- Update conditional rendering (lines 622, 999) to use the permission-based check

### Phase 10: Add Frontend Password Strength Indicator

**Files:**

- `event-horizon-dashboards/src/lib/passwordValidation.ts` (NEW)
- Update registration/password change forms

Add client-side password strength checking for better UX:

- Real-time password strength indicator
- Show requirements (length, complexity)
- Different requirements shown based on selected role

**Note:** Frontend validation is for UX only - backend validation is mandatory.

## Testing Strategy

1. **Test Password Requirements:**

   - Regular user registration with weak password → Should be rejected
   - Admin registration with weak password → Should be rejected
   - Admin registration with strong password → Should succeed
   - Test all complexity requirements individually

2. **Test Password Expiration:**

   - Create admin account with old password_changed_at
   - Attempt login → Should require password change
   - Change password → Should allow login

3. **Test Frontend:**

   - Verify superadmin email is not in JavaScript bundle
   - Verify permission endpoint works correctly
   - Test password strength indicator

4. **Test Edge Cases:**

   - Common passwords (password, 12345678, etc.) → Should be rejected
   - Passwords matching user email → Should be rejected (optional enhancement)

## Files to Create/Modify

**New Files:**

1. `validity_backend/app/Services/PasswordValidationService.php`
2. `validity_backend/database/migrations/YYYY_MM_DD_HHMMSS_add_password_changed_at_to_users_table.php`
3. `event-horizon-dashboards/src/lib/passwordValidation.ts`

**Modified Files:**

1. `validity_backend/app/Models/User.php` - Add password_changed_at field and expiration check
2. `validity_backend/app/Http/Controllers/AuthController.php` - Update register, login, resetPassword
3. `validity_backend/app/Http/Controllers/UserController.php` - Update updatePassword, add permission endpoint
4. `event-horizon-dashboards/src/pages/Users.tsx` - Remove hardcoded email, use permission endpoint

## Security Considerations

- **Backward Compatibility:** Existing users with weak passwords will be required to change on next login (for privileged accounts) or next password update
- **Migration Strategy:** Set `password_changed_at` to current timestamp for all existing users to avoid immediate expiration
- **Rate Limiting:** Ensure password reset/change endpoints have rate limiting to prevent brute force
- **Audit Logging:** Log all password changes, especially for privileged accounts
- **Password History:** Consider implementing password history to prevent reuse (future enhancement)

## Risk Mitigation

- **Low Risk:** Changes only add validation and remove exposed data
- **User Impact:** Privileged users will need to set stronger passwords and may need to change expired passwords
- **Migration Required