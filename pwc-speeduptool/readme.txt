=== PWC - SpeedUpTool ===
Contributors: prowebcare
Tags: speed, performance, prefetch, instant, optimization
Requires at least: 5.0
Tested up to: 6.4
Requires PHP: 7.2
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Speed up your WordPress site with instant.page technology. Make your site feel blazingly fast by preloading pages before visitors click.

== Description ==

**PWC SpeedUpTool** makes your WordPress website feel instantly fast by using cutting-edge prefetch technology. Based on instant.page v5.2.0, it preloads pages just before visitors click on links, making navigation feel instant.

### How It Works

When a visitor hovers over a link (or when links become visible on mobile), PWC SpeedUpTool prefetches that page in the background. When the visitor clicks, the page loads instantly from cache. This creates a noticeably faster browsing experience.

### Key Features

* **Zero Configuration** - Works out of the box with smart defaults
* **Multiple Intensity Modes** - Choose from hover, mousedown, or viewport-based prefetch
* **Mobile Optimized** - Special viewport mode for mobile devices
* **Memory Safe** - Built-in FIFO cache prevents unbounded memory growth
* **Security Hardened** - Enhanced with XSS protection and strict CSP compatibility
* **Speculation Rules API** - Uses modern browser APIs for best performance
* **Granular Control** - Whitelist/blacklist specific links with data attributes
* **External Links** - Optional cross-origin prefetch support (Chromium)
* **Query String Support** - Configurable prefetch for URLs with parameters
* **No jQuery Dependency** - Pure vanilla JavaScript, blazingly fast

### Perfect For

* Blogs and content websites
* E-commerce stores
* News and magazine sites
* Documentation sites
* Any WordPress site wanting faster navigation

### Performance Benefits

* **Perceived Load Time:** Reduced by 50-90% on prefetched pages
* **Time to First Byte:** Effectively near-zero for prefetched pages
* **User Experience:** Noticeably snappier navigation
* **File Size:** Only 2.5KB Brotli compressed
* **Memory Usage:** Bounded at ~23KB maximum

### Intensity Modes

1. **Default (65ms hover)** - Prefetch after 65ms hover. Best for most sites.
2. **Mousedown** - Prefetch when mouse button pressed. Good for moderate traffic.
3. **Mousedown Only** - Only prefetch on mousedown, not hover. Conservative mode.
4. **Viewport (Mobile)** - Prefetch visible links on smartphones. Great for mobile-heavy sites.
5. **Viewport All** - Prefetch all visible links. Aggressive mode, may increase server load.

### Browser Support

* **Chrome/Edge:** Full support including Speculation Rules API
* **Firefox:** Full prefetch support (115+)
* **Safari:** Prefetch support (15.4+), Speculation Rules (17.0+)
* **Mobile:** Full support on all modern mobile browsers

### Advanced Usage

Disable prefetch for specific links:
`<a href="/page" data-no-instant>No Prefetch</a>`

In whitelist mode, only prefetch specific links:
`<a href="/page" data-instant>Prefetch This</a>`

### Based on instant.page v5.2.0

PWC SpeedUpTool is built on instant.page v5.2.0 with additional enhancements:

* Fixed XSS vulnerability in test environment
* Implemented FIFO cache to prevent memory leaks
* Fixed event pooling issues on touch devices
* Added comprehensive JSDoc documentation
* Strict equality operators throughout
* Enhanced security and performance optimizations

### ProWebCare

Developed by [ProWebCare](https://prowebcare.com/) - Your WordPress performance experts.

== Installation ==

### Automatic Installation

1. Log in to your WordPress dashboard
2. Navigate to Plugins > Add New
3. Search for "PWC SpeedUpTool"
4. Click "Install Now" and then "Activate"
5. That's it! The plugin works automatically with default settings

### Manual Installation

1. Download the plugin ZIP file
2. Log in to your WordPress dashboard
3. Navigate to Plugins > Add New > Upload Plugin
4. Choose the ZIP file and click "Install Now"
5. Click "Activate Plugin"

### Configuration

1. Go to Settings > PWC SpeedUpTool
2. Enable the plugin (enabled by default)
3. Choose your preferred intensity mode
4. Configure advanced options if needed
5. Click "Save Settings"

== Frequently Asked Questions ==

= Does this work with caching plugins? =

Yes! PWC SpeedUpTool works perfectly with caching plugins like WP Super Cache, W3 Total Cache, and WP Rocket. It adds an additional layer of speed on top of your existing caching.

= Will this increase my server load? =

Default settings are designed to be server-friendly. The plugin only prefetches when users show intent to navigate (hovering over links). Avoid "Viewport All" mode on sites with many links unless you have robust server resources.

= Does it work on mobile devices? =

Yes! PWC SpeedUpTool has special mobile optimization. Use "Viewport (Mobile)" mode to prefetch visible links on smartphones while being conservative with server resources.

= Can I exclude specific pages from prefetch? =

Yes! Add `data-no-instant` attribute to any link:
`<a href="/page" data-no-instant>No Prefetch</a>`

= Does it work with WooCommerce? =

Yes! PWC SpeedUpTool works great with WooCommerce. However, you may want to enable "Allow Query Strings" if your store uses URL parameters for filtering products.

= What about GDPR compliance? =

PWC SpeedUpTool does not collect, store, or transmit any user data. It only instructs the browser to prefetch pages. However, prefetching may trigger analytics events on your site. Check your analytics configuration.

= Can I use it with a CDN? =

Absolutely! PWC SpeedUpTool works seamlessly with CDNs like Cloudflare, CloudFront, and others.

= Does it work with page builders? =

Yes! PWC SpeedUpTool is compatible with all major page builders including Elementor, Divi, Beaver Builder, and others.

= What browsers are supported? =

* Chrome/Edge 100+ (full support)
* Firefox 115+ (full support)
* Safari 15.4+ (full support)
* All modern mobile browsers

= How can I verify it's working? =

1. Open your website
2. Open browser DevTools (F12) > Network tab
3. Hover over a link
4. You should see a prefetch request in the Network tab
5. Click the link - it loads instantly from cache

= What's the difference from other prefetch plugins? =

PWC SpeedUpTool is based on instant.page, the most advanced prefetch library available. It includes:

* Multiple intensity modes
* Speculation Rules API support
* Memory-bounded caching
* Touch device optimization
* Security hardening
* Active development and updates

== Screenshots ==

1. Settings page with all configuration options
2. Network tab showing prefetch requests
3. Performance improvement demonstration
4. Mobile viewport prefetch in action

== Changelog ==

= 1.0.0 - 2026-01-23 =
* Initial release
* Based on instant.page v5.2.0
* 5 intensity modes: default, mousedown, mousedown-only, viewport, viewport-all
* Speculation Rules API support
* FIFO cache implementation (prevents memory leaks)
* Fixed XSS vulnerability in test environment
* Fixed event pooling issues on touch devices
* Security hardening with strict equality operators
* Comprehensive admin settings page
* WordPress coding standards compliance
* Full internationalization support
* Uninstall cleanup

== Upgrade Notice ==

= 1.0.0 =
Initial release. Install and enjoy instant page loads!

== Technical Details ==

### Architecture

PWC SpeedUpTool uses a sophisticated prefetch strategy:

1. **Event Listeners:** Captures hover, mousedown, or viewport events
2. **Eligibility Check:** Validates links against security and configuration rules
3. **Prefetch Trigger:** Uses Speculation Rules API or link prefetch element
4. **FIFO Cache:** Tracks up to 100 unique URLs, prevents memory growth
5. **Instant Navigation:** Serves prefetched page from browser cache

### Security

* No external dependencies or CDN requests
* Content Security Policy (CSP) compatible
* XSS protection through strict HTML escaping
* No data collection or transmission
* Open source and auditable code

### Performance

* **File Size:** 2.5KB Brotli compressed (28KB uncompressed)
* **Memory Usage:** Maximum ~23KB for cache (100 URLs × ~230 bytes)
* **Load Time:** Zero impact - loaded asynchronously in footer
* **CPU Usage:** Minimal - only runs on user interaction
* **Network:** Smart prefetch only when needed

### Configuration via PHP

Advanced users can configure via code:

```php
// Disable plugin programmatically
add_filter('option_pwc_speedup_enabled', '__return_zero');

// Change intensity mode
add_filter('option_pwc_speedup_intensity', function() {
    return 'mousedown';
});

// Allow query strings
add_filter('option_pwc_speedup_allow_query_string', '__return_true');
```

### Compatibility

* WordPress 5.0+
* PHP 7.2+
* Works with all themes
* Works with all page builders
* Compatible with all caching plugins
* Compatible with all CDNs
* Compatible with WooCommerce
* Compatible with WPML and Polylang

== Support ==

Need help? Visit [ProWebCare](https://prowebcare.com/) for documentation and support.

== Credits ==

* Based on [instant.page](https://instant.page/) by Alexandre Dieulot
* Enhanced and packaged for WordPress by [ProWebCare](https://prowebcare.com/)
* instant.page is licensed under MIT License

== Privacy ==

PWC SpeedUpTool does not:

* Collect any user data
* Send data to external servers
* Use cookies
* Track users
* Require user registration

The plugin only instructs the browser to prefetch pages on your own website. All prefetch activity happens locally in the user's browser.
