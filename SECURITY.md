# Security Guide: instant.page

## Overview

instant.page is designed with security as a foundational principle. This document explains the security model, deployment considerations, and best practices for using instant.page safely in production.

## Security Model

### How Prefetch Works Securely

instant.page uses two browser APIs for prefetching, both with strong security guarantees:

#### 1. Speculation Rules API (Modern)

```javascript
<script type="speculationrules">
{
  "prefetch": [{
    "source": "list",
    "urls": ["/page.html"]
  }]
}
</script>
```

**Security Properties:**
- ✅ Respects CORS (Cross-Origin Resource Sharing)
- ✅ Honors Content Security Policy
- ✅ No credentials sent for cross-origin prefetch (unless user has no cookies)
- ✅ Prefetch isolated from main page context
- ✅ Cannot execute JavaScript during prefetch

#### 2. Link Prefetch (Fallback)

```javascript
<link rel="prefetch" href="/page.html" as="document">
```

**Security Properties:**
- ✅ Same-origin by default
- ✅ Cross-origin requires `as="document"` (Chromium only)
- ✅ Respects Cache-Control headers
- ✅ User preferences honored (data saver, battery saver)
- ✅ No JavaScript execution

### What instant.page Does NOT Do

- ❌ Does not execute JavaScript from prefetched pages
- ❌ Does not modify cookies or session state during prefetch
- ❌ Does not send credentials to cross-origin URLs (without user cookies)
- ❌ Does not bypass Content Security Policy
- ❌ Does not prefetch non-HTTP(S) protocols (file://, javascript://, data://)

---

## Content Security Policy (CSP)

### Recommended CSP Configuration

instant.page is compatible with strict Content Security Policies. Here's a recommended configuration:

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'sha384-<HASH>';
  connect-src 'self';
  style-src 'self' 'unsafe-inline';
```

**Replace `<HASH>` with the SHA-384 hash of instantpage.js:**

```html
<script src="/instantpage.js"
        integrity="sha384-..."
        crossorigin="anonymous">
</script>
```

Generate the hash:
```bash
cat instantpage.js | openssl dgst -sha384 -binary | openssl base64 -A
```

### CSP with Inline instant.page

If you inline instant.page (not recommended due to caching), use a nonce:

```html
<script nonce="random-nonce-here">
  // instant.page code here
</script>
```

```http
Content-Security-Policy: script-src 'nonce-random-nonce-here';
```

### Speculation Rules and CSP

Speculation rules require the `script-src` directive to allow `'inline-speculation-rules'` or use a nonce:

```http
Content-Security-Policy: script-src 'self' 'inline-speculation-rules';
```

Or with nonce (dynamically created):
```http
Content-Security-Policy: script-src 'self' 'nonce-abc123';
```

---

## Deployment Considerations

### 1. Same-Origin Prefetch (Default - Most Secure)

**Configuration:**
```html
<body>
  <script src="/instantpage.js" type="module"></script>
</body>
```

**Security Properties:**
- ✅ Only prefetches same-origin URLs
- ✅ Full credential and cookie support
- ✅ No cross-origin information leakage

**Best For:**
- Standard websites
- Multi-page applications
- Sites with authentication

### 2. Cross-Origin Prefetch (Requires Configuration)

**Configuration:**
```html
<body data-instant-allow-external-links>
  <script src="/instantpage.js" type="module"></script>
</body>
```

**Security Considerations:**

⚠️ **Cookie Leakage Risk:**
Cross-origin prefetch will NOT be sent if the user has cookies for the destination domain. This is a browser security feature, not an instant.page limitation.

⚠️ **Subdomain Considerations:**
If `example.com` sets cookies with `Domain=.example.com`, those cookies apply to `subdomain.example.com`. Cross-origin prefetch from `example.com` to `subdomain.example.com` will:
- Be blocked if cookies exist for the subdomain
- Reveal that the user has visited the subdomain (timing attack)

**Recommendations:**
1. Only enable for trusted external domains
2. Use per-link whitelisting instead of global:
   ```html
   <a href="https://trusted-site.com" data-instant>External link</a>
   ```
3. Understand your cookie scoping

### 3. Query String Handling

**Default Behavior:**
instant.page does NOT prefetch URLs with query strings by default.

**Reason:** Query strings often contain:
- Session tokens
- CSRF tokens
- Tracking parameters
- User-specific data

**Enable with Caution:**
```html
<body data-instant-allow-query-string>
```

**Safe Query String Patterns:**
- ✅ Pagination: `/products?page=2`
- ✅ Filters: `/search?category=books`
- ✅ Sorting: `/list?sort=date`

**Unsafe Query String Patterns:**
- ❌ Tokens: `/checkout?token=abc123`
- ❌ Actions: `/delete?id=5`
- ❌ Session IDs: `/page?sessionId=xyz`

---

## Vulnerability Disclosure

### Reporting Security Issues

**Do NOT report security vulnerabilities in public GitHub issues.**

Instead, report them privately:
1. Email: [security contact - to be added]
2. GitHub Security Advisory: https://github.com/instantpage/instant.page/security/advisories/new

### What to Include

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional)

### Security Release Process

1. **Private fix** - Develop fix in private repository
2. **Security advisory** - Publish advisory with CVE
3. **Coordinated disclosure** - 90-day embargo before public disclosure
4. **Patch release** - Release fixed version
5. **Public disclosure** - Detailed write-up and mitigation

---

## Known Security Considerations

### 1. Timing Attacks

**Issue:** Prefetch timing can reveal user state.

**Example:**
- User is logged in → Prefetch succeeds fast (from cache)
- User is logged out → Prefetch takes longer (redirect to login)

**Mitigation:**
- Use same HTML for logged-in/out states
- Implement client-side rendering
- Add cache headers consistently

### 2. Information Leakage via Prefetch

**Issue:** Adversary observes which links are prefetched.

**Example:**
- User hovers over "Premium Features" link → Reveals interest
- Network observer sees prefetch → Knows what user is viewing

**Mitigation:**
- Use HTTPS (prevents network observation)
- Use `viewport` or `viewport-all` intensity (less selective)
- Understand threat model (passive observer vs. active attacker)

### 3. Server Load from Aggressive Prefetching

**Issue:** `viewport-all` mode can prefetch many URLs.

**Security Impact:**
- Self-inflicted DDoS if many links visible
- Increased server costs
- Potential rate limiting

**Mitigation:**
```html
<!-- Conservative: Only prefetch on hover -->
<body data-instant-intensity="65">

<!-- Moderate: Only on mousedown -->
<body data-instant-intensity="mousedown">

<!-- Aggressive: Viewport (recommended for small screens only) -->
<body data-instant-intensity="viewport">
```

### 4. Cache Poisoning

**Issue:** Prefetched content cached incorrectly.

**Example:**
- User prefetches `/admin` while logged in
- Another user navigates to `/admin`
- Sees cached admin page (HTTP cache misconfiguration)

**Mitigation:**
```http
# For authenticated pages
Cache-Control: private, no-cache

# For public pages with user-specific content
Vary: Cookie

# For completely public pages
Cache-Control: public, max-age=3600
```

---

## Security Testing

### Running Security Tests

instant.page includes a security test suite:

```bash
node test/security-test.js
```

This tests:
- HTML entity escaping
- XSS prevention
- Quote injection attacks
- Multiple angle bracket attacks

### Manual Security Testing

#### 1. Test XSS Protection

Create a malicious link:
```html
<a href='javascript:alert("XSS")'>Click me</a>
```

Expected behavior: instant.page should NOT prefetch this (non-HTTP protocol).

#### 2. Test Cross-Origin Restrictions

Without `data-instant-allow-external-links`:
```html
<a href="https://example.com">External</a>
```

Expected behavior: NOT prefetched.

With `data-instant`:
```html
<a href="https://example.com" data-instant>External</a>
```

Expected behavior: Prefetched (if Chromium-based browser).

#### 3. Test Query String Protection

Without `data-instant-allow-query-string`:
```html
<a href="/page?token=secret123">Link</a>
```

Expected behavior: NOT prefetched.

---

## Best Practices Summary

### ✅ Do

1. **Use HTTPS** - Always serve instant.page over HTTPS
2. **Set proper Cache-Control** - Especially for authenticated pages
3. **Test your CSP** - Ensure instant.page works with your policy
4. **Use integrity attributes** - Subresource Integrity (SRI) for CDN
5. **Monitor prefetch behavior** - Check server logs for unusual patterns
6. **Use conservative intensity** - Start with hover (65ms) or mousedown
7. **Whitelist sensitive links** - Use `data-instant` for selective prefetch

### ❌ Don't

1. **Don't enable external links globally** - Whitelist instead
2. **Don't allow query strings blindly** - Understand your URLs
3. **Don't prefetch authenticated actions** - Use `data-no-instant`
4. **Don't ignore cookie scoping** - Subdomain cookies affect prefetch
5. **Don't use viewport-all on large pages** - Risk server overload
6. **Don't skip CSP configuration** - Defense in depth
7. **Don't trust user input in URLs** - Always validate server-side

---

## Security Changelog

### v5.2.0 (Current)

- ✅ Added browser version checks (Chromium 100+, Firefox 115+, Safari 15.4+)
- ✅ Added prefetch detection and warning system
- ✅ Improved touch event disambiguation

### v5.1.0

- ✅ Added Speculation Rules API support
- ✅ Improved cross-origin prefetch safety

### v5.0.0

- ✅ Rewritten with modern JavaScript
- ✅ Removed unsafe prefetch patterns

---

## Compliance

### GDPR

instant.page itself does NOT collect personal data. However:

⚠️ **Prefetch reveals user intent** - Server logs show prefetched URLs
⚠️ **Consider consent** - If prefetch triggers analytics

### CCPA

Similar considerations as GDPR.

### WCAG (Accessibility)

✅ instant.page does not interfere with:
- Screen readers
- Keyboard navigation
- Focus management
- ARIA attributes

---

## Conclusion

instant.page is designed to be secure by default, with multiple layers of protection:

1. **Browser security** - Leverages built-in prefetch security
2. **Conservative defaults** - Same-origin, no query strings
3. **Explicit opt-in** - External links require configuration
4. **Protocol filtering** - Only HTTP(S) allowed
5. **CSP compatible** - Works with strict policies

For most deployments, the default configuration is secure and appropriate.

---

**Last Updated:** 2026-01-14
**Version:** 5.2.0
**Maintained by:** instant.page team
