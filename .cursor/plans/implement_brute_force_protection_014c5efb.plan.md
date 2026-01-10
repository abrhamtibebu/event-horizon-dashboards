---
name: Implement Brute Force Protection
overview: Implement rate limiting, account lockout, and enhanced security measures on the login endpoint to prevent brute force attacks.
todos:
  - id: create-login-attempt-service
    content: Create LoginAttemptService to track failed login attempts and manage account lockouts
    status: completed
  - id: update-login-endpoint
    content: Update login endpoint to check for account lockouts and record failed attempts
    status: completed
    dependencies:
      - create-login-attempt-service
  - id: add-rate-limiting
    content: Add rate limiting middleware to login route (email-based, 5 attempts per 15 minutes)
    status: completed
  - id: reduce-jwt-ttl
    content: Reduce JWT token expiration from 4 hours to 1 hour for better security
    status: completed
  - id: add-progressive-delays
    content: Implement progressive delays for failed login attempts (2 second delay after 3+ failures)
    status: completed
    dependencies:
      - create-login-attempt-service
  - id: test-brute-force-protection
    content: Test that rate limiting and account lockout work correctly to prevent brute force attacks
    status: completed
    dependencies:
      - update-login-endpoint
      - add-rate-limiting
---

# I

mplement Brute Force Protection for Login Endpoint

## Problem Analysis

**Current Vulnerabilities:**

1. **No Rate Limiting**: The login endpoint (`/api/login`) has no rate limiting, allowing unlimited login attempts
2. **No Account Lockout**: Failed login attempts are logged but accounts are never locked, allowing brute force attacks to continue indefinitely
3. **No Progressive Delays**: No increasing delays between failed attempts
4. **Long JWT Expiration**: JWT tokens expire after 240 minutes (4 hours), which is quite long for security-sensitive operations
5. **No CAPTCHA**: No challenge-response mechanism after multiple failures

**Impact:**

- Attackers can perform unlimited login attempts without being blocked
- High-privilege accounts can be compromised through brute force
- Successful attacks result in long-lived JWT tokens (4 hours)

## Implementation Plan

### Phase 1: Create Login Attempt Tracking Service

**File: `validity_backend/app/Services/LoginAttemptService.php`** (NEW)Create a service to track and manage login attempts:

1. **Track Failed Attempts:**

- Store failed login attempts in cache (Redis/file cache)
- Key format: `login_attempts:{email}` or `login_attempts:{ip}`
- Track: attempt count, last attempt time, lockout status

2. **Account Lockout Logic:**

- Lock account after 5 failed attempts
- Lockout duration: 15 minutes (configurable)
- Track lockout expiration time
- **Important**: Lockout only affects new login attempts - existing sessions remain active

3. **Progressive Delays:**

- After 3 failed attempts: 2 second delay + warning message
- After 5 failed attempts: account locked

4. **User Warnings:**

- After 3 failed attempts: Return warning message with remaining attempts
- Helps prevent accidental lockouts for legitimate users

4. **Key Methods:**
   ```php
         public function recordFailedAttempt(string $email, string $ip): void
         public function recordSuccessfulAttempt(string $email): void
         public function isLocked(string $email): bool
         public function getRemainingLockoutTime(string $email): int
         public function getRemainingAttempts(string $email): int
         public function clearAttempts(string $email): void
   ```




### Phase 2: Add Rate Limiting Middleware

**File: `validity_backend/app/Http/Middleware/LoginRateLimitMiddleware.php`** (NEW)Create middleware specifically for login endpoint:

1. **Email-Based Rate Limiting:**

- Limit: 5 attempts per 15 minutes per email
- Use Laravel's rate limiter with email as key
- Return 429 Too Many Requests when limit exceeded

2. **IP-Based Rate Limiting (Secondary):**

- Limit: 10 attempts per 15 minutes per IP
- Prevents distributed brute force from single IP

3. **Integration:**

- Apply to login route only
- Work in conjunction with LoginAttemptService

### Phase 3: Update Login Endpoint

**File: `validity_backend/app/Http/Controllers/AuthController.php`Method: `login()`** (Line 96+)**Changes:**

1. Check if account is locked before attempting authentication
2. Record failed attempts using LoginAttemptService
3. Clear attempts on successful login
4. Add progressive delay for failed attempts
5. Return appropriate error messages for locked accounts

**Implementation:**

```php
// Check if account is locked
$loginAttemptService = app(\App\Services\LoginAttemptService::class);
if ($loginAttemptService->isLocked($email)) {
    $lockoutTime = $loginAttemptService->getRemainingLockoutTime($email);
    return response()->json([
        'error' => 'Account temporarily locked',
        'message' => "Too many failed login attempts. Please try again in {$lockoutTime} minutes.",
        'lockout_until' => now()->addMinutes($lockoutTime)->toIso8601String(),
    ], 423); // 423 Locked
}

// Attempt authentication
if (! $token = JWTAuth::attempt($credentials)) {
    // Record failed attempt
    $loginAttemptService->recordFailedAttempt($email, $request->ip());
    
    $remainingAttempts = $loginAttemptService->getRemainingAttempts($email);
    
    // Add progressive delay
    if ($remainingAttempts <= 2) {
        sleep(2); // 2 second delay after 3+ failed attempts
    }
    
    SecurityAuditLogger::logAuthentication('failed_login', $user ? $user->id : null, [
        'attempted_email' => $request->email,
        'reason' => 'Invalid credentials',
        'remaining_attempts' => $remainingAttempts,
    ]);
    
    // Provide warning after 3 failed attempts
    $warningMessage = '';
    if ($remainingAttempts <= 2) {
        $warningMessage = "Warning: {$remainingAttempts} attempt(s) remaining before account lockout.";
    }
    
    return response()->json([
        'error' => 'Invalid credentials',
        'remaining_attempts' => $remainingAttempts,
        'warning' => $warningMessage,
    ], 401);
}

// Clear attempts on successful login
$loginAttemptService->recordSuccessfulAttempt($email);
```



### Phase 4: Add Database Fields for Account Lockout (Optional Enhancement)

**File: `validity_backend/app/Models/User.php`Database Migration:**

- Add `failed_login_attempts` (integer, default 0)
- Add `locked_until` (timestamp, nullable)
- Add `last_failed_login_at` (timestamp, nullable)

**Note:** This is optional if using cache-based tracking. Cache is preferred for performance, but database provides persistence across cache clears.

### Phase 5: Reduce JWT Token Expiration

**File: `validity_backend/config/jwt.php`Changes:**

- Reduce default JWT TTL from 240 minutes (4 hours) to 60 minutes (1 hour)
- Keep refresh token TTL at current value for user convenience
- Update `AuthController::register()` to use new default

**Security Benefit:**

- Shorter token lifetime reduces impact of token theft
- Users can still refresh tokens without re-authenticating

### Phase 6: Add Rate Limiting to Login Route

**File: `validity_backend/routes/api.php`Changes:**

- Apply `LoginRateLimitMiddleware` to login route
- Or use Laravel's built-in throttle middleware with email-based key

**Example:**

```php
Route::post('login', [AuthController::class, 'login'])
    ->middleware('throttle:5,15'); // 5 attempts per 15 minutes
```

**Note:** Laravel's throttle uses IP by default. We need email-based throttling, so custom middleware is preferred.

### Phase 7: Enhance Security Audit Logging

**File: `validity_backend/app/Http/Controllers/AuthController.php`Enhancements:**

- Log lockout events
- Log rate limit violations
- Include IP address and user agent in all login attempts
- Track attempt patterns (rapid successive failures)

## Implementation Details

### LoginAttemptService Implementation:

```php
class LoginAttemptService
{
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_DURATION = 15; // minutes
    const CACHE_PREFIX = 'login_attempts:';
    const CACHE_TTL = 900; // 15 minutes in seconds

    public function recordFailedAttempt(string $email, string $ip): void
    {
        $key = self::CACHE_PREFIX . md5(strtolower($email));
        $attempts = Cache::get($key, ['count' => 0, 'locked_until' => null]);
        
        $attempts['count']++;
        $attempts['last_attempt'] = now();
        $attempts['ip'] = $ip;
        
        // Lock account after max attempts
        if ($attempts['count'] >= self::MAX_ATTEMPTS) {
            $attempts['locked_until'] = now()->addMinutes(self::LOCKOUT_DURATION);
        }
        
        Cache::put($key, $attempts, self::CACHE_TTL);
    }

    public function isLocked(string $email): bool
    {
        $key = self::CACHE_PREFIX . md5(strtolower($email));
        $attempts = Cache::get($key);
        
        if (!$attempts || !isset($attempts['locked_until'])) {
            return false;
        }
        
        // Check if lockout has expired
        if (now()->greaterThan($attempts['locked_until'])) {
            Cache::forget($key);
            return false;
        }
        
        return true;
    }

    public function getRemainingLockoutTime(string $email): int
    {
        $key = self::CACHE_PREFIX . md5(strtolower($email));
        $attempts = Cache::get($key);
        
        if (!$attempts || !isset($attempts['locked_until'])) {
            return 0;
        }
        
        $remaining = now()->diffInMinutes($attempts['locked_until']);
        return max(0, $remaining);
    }

    public function getRemainingAttempts(string $email): int
    {
        $key = self::CACHE_PREFIX . md5(strtolower($email));
        $attempts = Cache::get($key, ['count' => 0]);
        
        return max(0, self::MAX_ATTEMPTS - $attempts['count']);
    }

    public function recordSuccessfulAttempt(string $email): void
    {
        $key = self::CACHE_PREFIX . md5(strtolower($email));
        Cache::forget($key);
    }

    public function clearAttempts(string $email): void
    {
        $this->recordSuccessfulAttempt($email);
    }
}
```



## Testing Strategy

1. **Test Rate Limiting:**

- Attempt 6 logins with wrong password → 6th should be rate limited
- Wait 15 minutes → Should be able to attempt again
- Test with different emails → Each should have separate limit

2. **Test Account Lockout:**

- Attempt 5 failed logins → Account should be locked
- Attempt 6th login → Should receive 423 Locked response
- Wait 15 minutes → Should be able to attempt again

3. **Test Progressive Delays:**

- Attempt 3 failed logins → 4th should have 2 second delay
- Verify delay is applied before response

4. **Test Successful Login:**

- After failed attempts, successful login → Should clear attempt counter
- Verify no lockout after successful login

5. **Test JWT Expiration:**

- Login and verify token expires after 1 hour (not 4 hours)
- Verify refresh token still works

## Files to Create/Modify

**New Files:**

1. `validity_backend/app/Services/LoginAttemptService.php` - Track and manage login attempts
2. `validity_backend/app/Http/Middleware/LoginRateLimitMiddleware.php` - Rate limiting middleware (optional, can use Laravel throttle)

**Modified Files:**

1. `validity_backend/app/Http/Controllers/AuthController.php` - Update login method with lockout checks and attempt tracking
2. `validity_backend/routes/api.php` - Add rate limiting middleware to login route
3. `validity_backend/config/jwt.php` - Reduce default TTL to 60 minutes

**Optional Database Migration:**

- `validity_backend/database/migrations/YYYY_MM_DD_HHMMSS_add_login_lockout_fields_to_users_table.php` - If using database-based tracking

## Security Considerations

- **Cache-Based Tracking**: Uses cache for performance, but data is lost on cache clear (acceptable for security)
- **Email Normalization**: Always normalize email to lowercase for consistent tracking
- **IP Tracking**: Log IP addresses for security monitoring
- **Progressive Security**: Delays and lockouts increase with failed attempts
- **Clear on Success**: Successful login clears all attempt counters
- **JWT Security**: Shorter token lifetime reduces attack window

## Configuration Options

Make the following configurable via environment variables:

- `LOGIN_MAX_ATTEMPTS` (default: 5)
- `LOGIN_LOCKOUT_DURATION` (default: 15 minutes)
- `LOGIN_RATE_LIMIT_ATTEMPTS` (default: 5 per 15 minutes)
- `JWT_TTL` (default: 60 minutes)

## Risk Mitigation

- **Low Risk**: Changes only add security, don't remove functionality
- **User Impact**: Legitimate users may experience brief lockouts if they mistype password multiple times
- **Performance**: Cache-based tracking has minimal performance impact
- **Backward Compatibility**: Existing authentication flow remains the same, just with added protections
- **Backward Compatibility**: Existing authentication flow remains the same, just with added protections

## Workflow Preservation Considerations

To ensure the implementation doesn't disrupt the working flow:

1. **User Warnings**: Users receive warnings after 3 failed attempts (2 remaining) to prevent accidental lockouts
2. **Existing Sessions Preserved**: When an account is locked, existing active sessions remain valid - users can continue working without interruption
3. **No Admin Bypass**: Lockouts expire naturally after 15 minutes - no manual intervention needed, reducing administrative overhead
4. **Clear Error Messages**: Users receive clear, actionable error messages with remaining attempts and lockout time
5. **Progressive Delays**: Small delays (2 seconds) only after 3+ failures to slow attacks without significantly impacting legitimate users
6. **Automatic Reset**: Successful login automatically clears all attempt counters - no manual reset needed
7. **Cache-Based**: Fast, non-blocking implementation using cache - minimal performance impact on login flow