---
name: Fix CORS Misconfiguration
overview: Restrict CORS to only trusted domains by removing wildcard policy, implementing strict origin validation, and ensuring credentials are only allowed with specific origins.
todos:
  - id: fix-cors-middleware
    content: Update CorsMiddleware to always validate origins, remove wildcard support, and fix credentials conflict
    status: completed
  - id: add-cors-logging
    content: Add security logging for blocked CORS requests in CorsMiddleware
    status: completed
    dependencies:
      - fix-cors-middleware
  - id: configure-env-example
    content: Add CORS_ALLOWED_ORIGINS to .env.example with proper documentation
    status: completed
  - id: test-cors-restrictions
    content: Test that requests from allowed origins work and requests from unauthorized origins are blocked
    status: completed
    dependencies:
      - fix-cors-middleware
---

# Fix Im

proper Cross-Origin Resource Sharing Configuration

## Problem Analysis

**Current Vulnerabilities:**

1. **Wildcard CORS Policy**: The `CorsMiddleware` allows `Access-Control-Allow-Origin: *` in development or when `CORS_ALLOWED_ORIGINS` is not properly configured, exposing the API to any origin.
2. **Credentials Conflict**: The middleware sets `Access-Control-Allow-Credentials: true` while potentially allowing `*`, which is incompatible (browsers reject this combination).
3. **Insufficient Origin Validation**: The middleware only restricts origins in production AND when `CORS_ALLOWED_ORIGINS` is explicitly set to non-wildcard values.
4. **No Default Secure Configuration**: If environment variables are not set, the middleware defaults to allowing all origins.

**Impact:**

- Any external website can make authenticated requests to the API
- Sensitive data (events, organizers, user information) can be accessed by malicious sites
- User sessions can be hijacked through cross-origin requests

## Implementation Plan

### Phase 1: Fix CorsMiddleware to Always Validate Origins

**File: `validity_backend/app/Http/Middleware/CorsMiddleware.php`Changes:**

1. Remove wildcard (`*`) support entirely - always require specific origins
2. Fix the credentials conflict - only set `Access-Control-Allow-Credentials: true` when using specific origins
3. Implement strict origin validation that works in all environments
4. Add logging for blocked CORS requests for security monitoring

**Key Updates:**

- Always validate against allowed origins list (never use `*`)
- Default to empty allowed origins if not configured (fail secure)
- Only allow credentials when origin is explicitly whitelisted
- Log unauthorized CORS attempts for security auditing

### Phase 2: Configure Environment Variables

**File: `validity_backend/.env.example`** (if exists) or documentationAdd configuration for allowed origins:

```env
# CORS Configuration
# Comma-separated list of allowed origins (no wildcards)
# Example: https://app.validity.et,https://www.validity.et,https://validity.et
CORS_ALLOWED_ORIGINS=https://app.validity.et,https://www.validity.et
```

**Allowed Origins Should Include:**

- `https://app.validity.et` (main application)
- `https://www.validity.et` (if used)
- `https://validity.et` (if used)
- Any other legitimate frontend domains

### Phase 3: Add CORS Configuration Validation

**Enhancement to CorsMiddleware:**Add validation to ensure:

- At least one origin is configured in production
- Origins are valid URLs (scheme + domain)
- No wildcards in origin list
- Proper handling of subdomain variations if needed

### Phase 4: Update Security Headers Middleware (if needed)

**File: `validity_backend/app/Http/Middleware/SecurityHeaders.php`** (if exists)Ensure no conflicting CORS headers are set elsewhere that might override the CorsMiddleware.

### Phase 5: Add CORS Request Logging

**Enhancement to CorsMiddleware:**Log blocked CORS requests for security monitoring:

- Log origin that was blocked
- Log requested endpoint
- Include timestamp and IP address
- Use existing audit logging system if available

## Implementation Details

### Updated CorsMiddleware Logic:

```php
public function handle(Request $request, Closure $next)
{
    // Handle preflight OPTIONS request
    if ($request->isMethod('OPTIONS')) {
        $response = response('', 200);
    } else {
        $response = $next($request);
    }
    
    // Get allowed origins from environment (comma-separated, no wildcards)
    $allowedOriginsEnv = env('CORS_ALLOWED_ORIGINS', '');
    $allowedOrigins = !empty($allowedOriginsEnv) 
        ? array_map('trim', explode(',', $allowedOriginsEnv))
        : [];
    
    // Get the request origin
    $origin = $request->headers->get('Origin');
    
    // If no origins configured, deny all (fail secure)
    if (empty($allowedOrigins)) {
        \Log::warning('CORS: No allowed origins configured', [
            'request_origin' => $origin,
            'request_path' => $request->path(),
            'ip' => $request->ip(),
        ]);
        // Don't set CORS headers - browser will block the request
        return $response;
    }
    
    // Validate origin against allowed list
    if ($origin && in_array($origin, $allowedOrigins)) {
        // Origin is allowed - set CORS headers
        $response->headers->set('Access-Control-Allow-Origin', $origin);
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
    } else {
        // Origin not allowed - log and don't set CORS headers
        if ($origin) {
            \Log::warning('CORS: Blocked request from unauthorized origin', [
                'request_origin' => $origin,
                'allowed_origins' => $allowedOrigins,
                'request_path' => $request->path(),
                'ip' => $request->ip(),
            ]);
        }
        // Don't set Access-Control-Allow-Origin - browser will block
        return $response;
    }
    
    // Set other CORS headers only if origin is allowed
    $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-KEY, X-Requested-With, Accept, Origin');
    $response->headers->set('Access-Control-Max-Age', '86400');
    
    return $response;
}
```



## Testing Strategy

1. **Test Allowed Origins:**

- Request from `https://app.validity.et` → Should succeed with CORS headers
- Request from `https://www.malicious.com` → Should be blocked (no CORS headers)
- Verify `Access-Control-Allow-Origin` is set to the specific origin (not `*`)

2. **Test Credentials:**

- Verify `Access-Control-Allow-Credentials: true` is only set with specific origins
- Verify authenticated requests work from allowed origins

3. **Test Preflight Requests:**

- OPTIONS requests should return proper CORS headers
- Verify preflight cache works correctly

4. **Test Edge Cases:**

- Request without Origin header → Should work (same-origin)
- Request with malformed origin → Should be blocked
- Request when CORS_ALLOWED_ORIGINS is not set → Should deny all

## Files to Create/Modify

**Modified Files:**

1. `validity_backend/app/Http/Middleware/CorsMiddleware.php` - Fix origin validation and remove wildcard support
2. `validity_backend/.env.example` - Add CORS_ALLOWED_ORIGINS configuration (if file exists)

**Documentation:**

- Update deployment documentation to include CORS_ALLOWED_ORIGINS configuration requirement

## Security Considerations

- **Fail Secure**: If no origins are configured, deny all cross-origin requests
- **No Wildcards**: Never allow `*` in production or development
- **Credentials Safety**: Only allow credentials with specific, validated origins
- **Logging**: Log all blocked CORS attempts for security monitoring
- **Environment Separation**: Ensure production has proper origin restrictions

## Risk Mitigation

- **Low Risk**: Changes only restrict access, don't remove functionality
- **User Impact**: None - legitimate frontend will continue to work