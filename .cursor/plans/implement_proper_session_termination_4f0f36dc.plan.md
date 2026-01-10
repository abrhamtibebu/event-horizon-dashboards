---
name: Implement Proper Session Termination
overview: Implement token invalidation on logout to ensure that logged-out users cannot use their tokens, and optionally invalidate all user tokens to force logout from all devices.
todos:
  - id: update-logout-method
    content: Update logout method to invalidate current token and update last_login_at to invalidate all tokens
    status: completed
  - id: verify-blacklist-checking
    content: Verify that JWT middleware properly checks blacklist and rejects invalidated tokens
    status: completed
  - id: invalidate-on-password-change
    content: Update password change endpoint to invalidate all user tokens
    status: completed
  - id: enhance-logout-logging
    content: Add comprehensive logging for logout and token invalidation events
    status: completed
    dependencies:
      - update-logout-method
  - id: test-token-invalidation
    content: Test that tokens are properly invalidated after logout and cannot be reused
    status: completed
    dependencies:
      - update-logout-method
      - verify-blacklist-checking
---

# Implement Proper Session Termination After Logout

## Problem Analysis

**Current Vulnerabilities:**

1. **No Token Invalidation**: The `logout()` method only calls `auth()->logout()` which doesn't invalidate JWT tokens
2. **Tokens Remain Valid**: After logout, previously issued tokens continue to work and can be used to authenticate
3. **No Blacklist Check**: While JWT blacklist is enabled in config, it's not being used during logout
4. **Session Validation Gap**: `ValidateTokenSession` middleware validates tokens but doesn't prevent reuse after logout

**Impact:**

- Attackers can continue using stolen or intercepted tokens even after user logs out
- Users believe they're logged out but tokens remain active
- No way to revoke access when credentials are compromised
- Session hijacking risks persist after logout

## Implementation Plan

### Phase 1: Update Logout to Invalidate Current Token

**File: `validity_backend/app/Http/Controllers/AuthController.php`Method: `logout()`** (Line 288-300)**Changes:**

1. Get the current JWT token before logout
2. Invalidate/blacklist the token using JWT Auth's `invalidate()` method
3. Update user's `last_login_at` to invalidate all previous tokens (forces logout from all devices)
4. Mark user as offline
5. Log the logout event with token invalidation details

**Implementation:**

```php
public function logout()
{
    $user = auth()->user();
    
    if ($user) {
        try {
            // Get current token before logout
            $token = \Tymon\JWTAuth\Facades\JWTAuth::getToken();
            
            if ($token) {
                // Invalidate current token (blacklist it)
                \Tymon\JWTAuth\Facades\JWTAuth::invalidate($token);
                
                // Update last_login_at to invalidate all previous tokens
                // This ensures logout from all devices
                $user->last_login_at = now();
                $user->save();
            }
        } catch (\Exception $e) {
            // Log error but continue with logout
            \Log::warning('Token invalidation failed during logout', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
        
        // Mark user as offline upon logout
        $user->markAsOffline();
        
        // Log logout event
        SecurityAuditLogger::logAuthentication('logout', $user->id, [
            'token_invalidated' => $token ? true : false,
            'ip' => request()->ip(),
        ]);
    }
    
    auth()->logout();
    
    return response()->json([
        'message' => 'Successfully logged out',
        'tokens_invalidated' => true
    ]);
}
```



### Phase 2: Ensure Token Validation Checks Blacklist

**File: `validity_backend/app/Http/Middleware/ValidateTokenSession.php`Enhancement:**

- JWT Auth middleware already checks blacklist by default when `blacklist_enabled` is true
- Verify that blacklisted tokens are properly rejected
- Add logging for blacklisted token attempts

**Note:** The JWT Auth middleware (`jwt.auth`) should automatically reject blacklisted tokens. We need to ensure this is working correctly.

### Phase 3: Add Token Revocation Service (Optional Enhancement)

**File: `validity_backend/app/Services/TokenRevocationService.php`** (NEW - Optional)Create a service to manage token revocation:

1. **Revoke All User Tokens:**

- Method to invalidate all tokens for a specific user
- Useful for security incidents or password changes

2. **Revoke Specific Token:**

- Method to invalidate a specific token by JTI (JWT ID)

3. **Check Token Status:**

- Method to check if a token is blacklisted

**Key Methods:**

```php
public function revokeAllUserTokens(User $user): void
public function revokeToken(string $token): void
public function isTokenRevoked(string $token): bool
```



### Phase 4: Invalidate Tokens on Password Change

**File: `validity_backend/app/Http/Controllers/UserController.php`Method: `updatePassword()`Enhancement:**

- When password is changed, invalidate all existing tokens
- Force user to re-authenticate with new password
- Update `last_login_at` to invalidate all previous tokens

**Implementation:**

```php
// After successful password update
$user->last_login_at = now();
$user->save();

// Optionally revoke all tokens using TokenRevocationService
// This ensures all devices are logged out
```



### Phase 5: Add Logout All Devices Endpoint (Optional)

**File: `validity_backend/app/Http/Controllers/AuthController.php`New Method: `logoutAllDevices()`**Create an endpoint to logout from all devices:

- Useful for security incidents
- Allows users to force logout from all devices
- Updates `last_login_at` to invalidate all tokens

### Phase 6: Enhance Security Audit Logging

**File: `validity_backend/app/Http/Controllers/AuthController.php`Enhancements:**

- Log token invalidation events
- Track logout events with IP and user agent
- Log attempts to use invalidated tokens (if detectable)

## Implementation Details

### Updated Logout Method:

The logout method will:

1. Get current token before authentication is lost
2. Blacklist the current token using JWT Auth
3. Update `last_login_at` to invalidate all previous tokens (logout from all devices)
4. Mark user as offline
5. Log the logout event
6. Return success response

### Token Invalidation Strategy:

1. **Current Token**: Blacklisted immediately using `JWTAuth::invalidate($token)`
2. **All Previous Tokens**: Invalidated by updating `last_login_at`, which causes `ValidateTokenSession` to reject tokens with mismatched `last_login_at` claims
3. **Future Tokens**: New login will set new `last_login_at`, making old tokens invalid

### Workflow Preservation:

- **Non-Intrusive**: Only affects logout process, doesn't change login flow
- **Automatic**: Token invalidation happens automatically on logout
- **Transparent**: Users don't need to do anything different
- **Multi-Device**: Logout from one device logs out all devices (more secure)
- **Re-Login**: Users can immediately log back in with fresh tokens

## Testing Strategy

1. **Test Token Invalidation:**

- Login and get token
- Logout
- Attempt to use old token → Should be rejected (401 Unauthorized)
- Verify token is in blacklist

2. **Test All Devices Logout:**

- Login from device A, get token A
- Login from device B, get token B
- Logout from device A
- Verify token A is invalid
- Verify token B is also invalid (due to last_login_at update)

3. **Test Re-Login:**

- Logout
- Login again → Should receive new valid token
- Verify new token works correctly

4. **Test Password Change:**

- Login and get token
- Change password
- Attempt to use old token → Should be rejected
- Login with new password → Should work

5. **Test Concurrent Requests:**

- Make multiple requests with same token
- Logout during requests
- Verify subsequent requests are rejected

## Files to Create/Modify

**New Files (Optional):**

1. `validity_backend/app/Services/TokenRevocationService.php` - Token revocation management (optional enhancement)

**Modified Files:**

1. `validity_backend/app/Http/Controllers/AuthController.php` - Update logout method to invalidate tokens
2. `validity_backend/app/Http/Controllers/UserController.php` - Invalidate tokens on password change (optional)
3. `validity_backend/app/Http/Middleware/ValidateTokenSession.php` - Verify blacklist checking (if needed)

## Security Considerations

- **Blacklist Storage**: JWT blacklist uses cache/database - ensure it's persistent enough
- **Token Expiration**: Blacklisted tokens remain in blacklist until they expire naturally
- **Performance**: Blacklist checks add minimal overhead to token validation
- **Multi-Device Logout**: Updating `last_login_at` invalidates all devices, which is more secure
- **Grace Period**: Consider blacklist grace period for concurrent requests (already configured)

## Configuration

Ensure JWT blacklist is enabled (already enabled in config):

- `JWT_BLACKLIST_ENABLED=true` (default)
- `JWT_BLACKLIST_GRACE_PERIOD=0` (no grace period for security)

## Risk Mitigation

- **Low Risk**: Changes only add security, don't remove functionality
- **User Impact**: Users will be logged out from all devices when they logout (more secure)
- **Backward Compatibility**: Existing tokens will be invalidated on next logout, which is expected behavior
- **Performance**: Token blacklist checks are fast (cache-based)