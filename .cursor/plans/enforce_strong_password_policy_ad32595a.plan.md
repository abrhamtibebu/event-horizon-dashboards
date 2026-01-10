---
name: Enforce Strong Password Policy
overview: Add password validation to all endpoints where passwords are set, enhance common password detection, and ensure password policies are consistently enforced across the application.
todos: []
---

# Enforce Strong Password Policy

## Overview

The application has a `PasswordValidationService` that enforces strong password requirements, but it's not being used in all password-setting endpoints. This plan addresses gaps where passwords can be set without validation, particularly in admin user creation and password reset endpoints.

## Current State

**Already Validated:**

- ✅ `AuthController::register` - User registration
- ✅ `AuthController::resetPassword` - Password reset via email
- ✅ `UserController::updatePassword` - User changing their own password

**Missing Validation:**

- ❌ `UserController::store` - Admin/superadmin creating users
- ❌ `UserController::registerUsher` - Creating usher accounts
- ❌ `UserController::resetUserPassword` - Admin resetting user passwords
- ⚠️ `UsherRegistrationController` - Uses hardcoded default password (should require change on first login)

## Implementation Plan

### 1. Add Password Validation to User Creation Endpoint

**File:** `validity_backend/app/Http/Controllers/UserController.php`Add password validation in the `store` method (around line 327) before creating the user. Validate the password based on the role being assigned.

```php
// After determining $userRole and before $userData array
$passwordValidation = app(\App\Services\PasswordValidationService::class);
$passwordValidationResult = $passwordValidation->validatePassword($request->password, $userRole);

if (!$passwordValidationResult['valid']) {
    return response()->json(['error' => $passwordValidationResult['message']], 422);
}
```



### 2. Add Password Validation to Usher Registration

**File:** `validity_backend/app/Http/Controllers/UserController.php`Add password validation in the `registerUsher` method (around line 722) before creating the usher user.

```php
// After validation rules check and before User::create
$passwordValidation = app(\App\Services\PasswordValidationService::class);
$passwordValidationResult = $passwordValidation->validatePassword($request->password, 'usher');

if (!$passwordValidationResult['valid']) {
    return response()->json(['error' => $passwordValidationResult['message']], 422);
}
```



### 3. Add Password Validation to Admin Password Reset

**File:** `validity_backend/app/Http/Controllers/UserController.php`Add password validation in the `resetUserPassword` method (around line 785) before resetting the password. Validate based on the target user's role.

```php
// After authorization checks and before Hash::make
$passwordValidation = app(\App\Services\PasswordValidationService::class);
$passwordValidationResult = $passwordValidation->validatePassword($request->new_password, $user->role);

if (!$passwordValidationResult['valid']) {
    return response()->json(['error' => $passwordValidationResult['message']], 422);
}
```



### 4. Enhance Common Password Detection

**File:** `validity_backend/app/Services/PasswordValidationService.php`Expand the `COMMON_PASSWORDS` array and improve pattern detection to catch more weak passwords, including:

- Sequential numbers/letters (123456, abcdef, etc.)
- Keyboard patterns (qwerty, asdfgh, etc.)
- Common substitutions (P@ssw0rd, Adm1n, etc.)
- Short numeric-only passwords

Consider adding validation for:

- Passwords that are too similar to the email username
- Passwords with repeated characters (aaa, 1111, etc.)
- Passwords that are entirely numeric

### 5. Add Password Strength Indicator Enhancement (Optional)

**File:** `validity_backend/app/Services/PasswordValidationService.php`Enhance the validation to return strength information that can be used by the frontend for better UX feedback.

### 6. Ensure Default Password Requires Change

**File:** `validity_backend/app/Http/Controllers/UsherRegistrationController.php`For the hardcoded default password case, ensure that users must change their password on first login. This can be handled by:

- Setting a flag on the user model (e.g., `must_change_password`)
- Checking this flag during login and requiring password change
- Or generating a secure random password and sending it via secure channel

However, since this is an auto-creation flow, the current implementation may be intentional. Document this behavior or enhance it to use a more secure random password generator.

## Testing Considerations

1. **Test Admin User Creation:** Verify that weak passwords are rejected when admins create users
2. **Test Role-Based Validation:** Ensure privileged roles (admin/superadmin) require 12+ character passwords
3. **Test Usher Registration:** Verify password validation works for usher account creation
4. **Test Admin Password Reset:** Ensure admins cannot set weak passwords when resetting user passwords
5. **Test Common Passwords:** Verify that common passwords like "123456", "password", "admin" are rejected
6. **Test Edge Cases:** Empty passwords, very long passwords, special character handling

## Security Considerations

- All password validation must happen server-side (frontend validation is for UX only)
- Password validation errors should not reveal which specific requirement failed (return generic messages)
- Ensure password validation is consistent across all endpoints
- Consider logging failed password validation attempts for security monitoring
- For privileged accounts, consider even stricter requirements or password rotation policies

## Files to Modify

1. `validity_backend/app/Http/Controllers/UserController.php` - Add validation to `store`, `registerUsher`, and `resetUserPassword` methods
2. `validity_backend/app/Services/PasswordValidationService.php` - Enhance common password detection (optional but recommended)
3. Documentation/comments - Ensure code comments explain the validation requirements

## Workflow Preservation

- No changes to existing validated endpoints
- Only adds validation where it was missing