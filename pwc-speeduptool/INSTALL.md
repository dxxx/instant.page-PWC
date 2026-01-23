# PWC SpeedUpTool - Installation Guide

## Quick Start (3 Steps)

### Step 1: Install

**Option A: Direct Upload**
```bash
# Copy the entire folder to your WordPress plugins directory
cp -r pwc-speeduptool/ /path/to/wordpress/wp-content/plugins/
```

**Option B: ZIP Upload**
```bash
# Create a ZIP file
zip -r pwc-speeduptool.zip pwc-speeduptool/

# Then upload via WordPress Admin:
# Plugins > Add New > Upload Plugin
```

### Step 2: Activate

1. Go to WordPress Admin
2. Navigate to **Plugins**
3. Find **PWC - SpeedUpTool**
4. Click **Activate**

### Step 3: Configure (Optional)

1. Go to **Settings > PWC SpeedUpTool**
2. Choose your preferred intensity mode (default is recommended)
3. Click **Save Settings**

**That's it!** Your WordPress site is now faster! 🚀

---

## Testing Your Installation

### Verify It's Working

1. Open your WordPress site in a browser
2. Press **F12** to open Developer Tools
3. Click on the **Network** tab
4. Filter by "Prefetch" or "Other"
5. **Hover** over any link on your page
6. You should see a prefetch request appear!
7. **Click** the link - it loads instantly!

### What to Look For

In the Network tab, you'll see entries like:
```
instantpage.js    (module)  ← The plugin loaded
page-name         (prefetch) ← Links being prefetched
```

---

## Configuration Guide

### Intensity Modes Explained

| Mode | Best For | When It Prefetches | Server Load |
|------|----------|-------------------|-------------|
| **Default (65ms)** | Most websites | After 65ms hover | Low ⬇️ |
| **Mousedown** | Blogs, content sites | When mouse pressed | Low ⬇️ |
| **Mousedown Only** | High-traffic sites | Only on mousedown | Very Low ⬇️⬇️ |
| **Viewport (Mobile)** | Mobile-first sites | When link visible (mobile only) | Medium ⬆️ |
| **Viewport All** | Fast servers only | When link visible (all devices) | High ⬆️⬆️ |

**Recommendation:** Start with **Default**, test for a day, then adjust if needed.

### Advanced Settings

**Allow Query Strings**
- Enable if your site uses `?page=2` or similar URL parameters
- Common for: WooCommerce product filters, pagination
- ⚠️ May increase server load

**Allow External Links**
- Prefetch links to other domains (Chromium browsers only)
- Use case: Multi-domain sites, documentation sites
- ⚠️ Use cautiously

**Whitelist Mode**
- Only prefetch links with `data-instant` attribute
- Maximum control for mission-critical sites
- Example: `<a href="/important" data-instant>Click</a>`

**Mousedown Shortcut**
- Navigate immediately on mousedown (removes click delay)
- ⚠️ May conflict with JavaScript - test thoroughly!

**Speculation Rules**
- Modern browser API for better performance
- Auto = use if supported (recommended)
- Prerender = full page pre-rendering (Chrome only)

---

## Site-Specific Recommendations

### 📝 Blog / Content Site
```
Intensity: Default or Mousedown
Query Strings: Disabled
External Links: Disabled
Whitelist: Disabled
```

### 🛒 WooCommerce Store
```
Intensity: Default
Query Strings: Enabled (for filters)
External Links: Disabled
Whitelist: Disabled
```

### 📱 Mobile App / PWA
```
Intensity: Viewport (Mobile)
Query Strings: As needed
External Links: Disabled
Whitelist: Disabled
```

### 📰 News / Magazine
```
Intensity: Default
Query Strings: Enabled
External Links: Disabled
Whitelist: Disabled
```

### 🏢 Corporate / High-Traffic
```
Intensity: Mousedown Only
Query Strings: Disabled
External Links: Disabled
Whitelist: Enabled (optional)
```

---

## Advanced Usage

### Exclude Specific Links

Add `data-no-instant` to links you don't want prefetched:

```html
<!-- Prefetch will be skipped -->
<a href="/logout" data-no-instant>Logout</a>
<a href="/checkout" data-no-instant>Checkout</a>
<a href="/admin" data-no-instant>Admin Panel</a>
```

**When to use:**
- Logout links
- Form submissions
- Admin pages
- AJAX-heavy pages
- Pages with side effects

### Whitelist Specific Links (Whitelist Mode)

1. Enable "Use Whitelist Mode" in settings
2. Add `data-instant` to links you want prefetched:

```html
<!-- Only these will be prefetched -->
<a href="/article-1" data-instant>Article 1</a>
<a href="/article-2" data-instant>Article 2</a>

<!-- This will NOT be prefetched -->
<a href="/other-page">Other Page</a>
```

### Programmatic Configuration

Add to your theme's `functions.php`:

```php
// Disable plugin for logged-in users
add_filter('option_pwc_speedup_enabled', function($value) {
    return is_user_logged_in() ? '0' : $value;
});

// Use mousedown mode on mobile
add_filter('option_pwc_speedup_intensity', function($value) {
    return wp_is_mobile() ? 'mousedown' : $value;
});

// Disable on specific pages
add_filter('option_pwc_speedup_enabled', function($value) {
    if (is_page('checkout') || is_page('cart')) {
        return '0';
    }
    return $value;
});
```

---

## Troubleshooting

### Plugin Not Loading

**Check:**
1. Plugin is activated
2. No JavaScript errors in console (F12)
3. Browser supports ES modules (Chrome 61+, Firefox 60+, Safari 11+)

**Solution:**
- Clear browser cache
- Clear WordPress cache
- Check for JavaScript conflicts

### Links Not Prefetching

**Check:**
1. Plugin is enabled in settings
2. Links are `<a>` tags with valid `href`
3. Links are same-origin (unless external links enabled)
4. No `data-no-instant` on links

**Solution:**
- Test in browser DevTools Network tab
- Try different intensity mode
- Check browser console for errors

### Server Load Too High

**Solutions:**
1. Switch to "Mousedown Only" mode
2. Disable "Viewport All" mode
3. Enable whitelist mode
4. Use `data-no-instant` on high-traffic pages

### Conflicts with Other Plugins

**Common conflicts:**
- Lazy loading plugins (usually fine)
- AJAX navigation plugins (may conflict)
- Custom JavaScript (test thoroughly)

**Solution:**
- Disable other plugins one by one
- Check browser console for errors
- Use `data-no-instant` on problematic pages

### Analytics Showing Inflated Pageviews

**Cause:** Some analytics track prefetch as pageviews

**Solution:**
- Use Google Analytics 4 (handles prefetch correctly)
- Filter prefetch requests in analytics
- Check analytics documentation

---

## Performance Monitoring

### Measure the Impact

**Before/After Test:**

1. **Before:** Test your site with [WebPageTest](https://webpagetest.org)
2. **Install** PWC SpeedUpTool
3. **After:** Test again and compare

**Metrics to watch:**
- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- User engagement (lower bounce rate)

### Real User Monitoring

Add to your theme:

```javascript
// Track prefetch effectiveness
let prefetchCount = 0;
let cacheHits = 0;

document.addEventListener('DOMContentLoaded', () => {
    performance.getEntriesByType('navigation').forEach(nav => {
        if (nav.transferSize === 0) {
            cacheHits++;
            console.log('Page loaded from cache!');
        }
    });
});

// Log results
console.log(`Cache hits: ${cacheHits}`);
```

---

## Uninstallation

### Complete Removal

1. **Deactivate** plugin in WordPress admin
2. **Delete** plugin files
3. Database cleanup happens automatically via `uninstall.php`

**What gets removed:**
- All plugin options from database
- Plugin files from server
- Nothing else - your content is safe!

---

## Support & Resources

### Documentation
- **README.md** - Complete feature guide
- **readme.txt** - WordPress.org format
- **STRUCTURE.txt** - Plugin architecture

### Links
- **Website:** https://prowebcare.com/
- **instant.page:** https://instant.page/
- **Support:** https://prowebcare.com/support/

### Getting Help

1. Check this installation guide
2. Review the README.md
3. Check browser console for errors
4. Visit ProWebCare support

---

## Security & Privacy

### No Data Collection
✅ No analytics or tracking
✅ No external requests
✅ No cookies
✅ No user data storage

### GDPR Compliant
✅ No personal data processing
✅ No data transmission
✅ Local browser operation only

**Note:** Prefetching may trigger your own analytics. Check your analytics configuration separately.

---

## Next Steps

✅ Plugin installed
✅ Configuration optimized
✅ Testing completed

**Now:**
1. Monitor performance for 24-48 hours
2. Check server load
3. Gather user feedback
4. Adjust settings if needed

**Enjoy your faster WordPress site!** 🚀

---

*PWC SpeedUpTool v1.0.0 - Powered by instant.page v5.2.0*
