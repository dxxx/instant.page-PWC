<?php
/**
 * Plugin Name: PWC - SpeedUpTool
 * Plugin URI: https://prowebcare.com/
 * Description: Speed up your WordPress website with instant.page technology. Preloads pages before visitors click, making your site feel blazingly fast. Based on instant.page v5.2.0 with enhanced security and performance optimizations.
 * Version: 1.0.0
 * Author: ProWebCare
 * Author URI: https://prowebcare.com/
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: pwc-speeduptool
 * Domain Path: /languages
 * Requires at least: 5.0
 * Requires PHP: 7.2
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('PWC_SPEEDUP_VERSION', '1.0.0');
define('PWC_SPEEDUP_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PWC_SPEEDUP_PLUGIN_URL', plugin_dir_url(__FILE__));
define('PWC_SPEEDUP_PLUGIN_FILE', __FILE__);

/**
 * Main Plugin Class
 */
class PWC_SpeedUpTool {

    /**
     * Instance of this class
     */
    private static $instance = null;

    /**
     * Get singleton instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Load plugin text domain
        add_action('plugins_loaded', array($this, 'load_textdomain'));

        // Enqueue scripts
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));

        // Add settings link to plugins page
        add_filter('plugin_action_links_' . plugin_basename(PWC_SPEEDUP_PLUGIN_FILE), array($this, 'add_settings_link'));

        // Admin menu
        if (is_admin()) {
            add_action('admin_menu', array($this, 'add_admin_menu'));
            add_action('admin_init', array($this, 'register_settings'));
        }
    }

    /**
     * Load plugin text domain for translations
     */
    public function load_textdomain() {
        load_plugin_textdomain('pwc-speeduptool', false, dirname(plugin_basename(PWC_SPEEDUP_PLUGIN_FILE)) . '/languages');
    }

    /**
     * Enqueue instant.page script
     */
    public function enqueue_scripts() {
        // Check if plugin is enabled
        $enabled = get_option('pwc_speedup_enabled', '1');
        if ($enabled !== '1') {
            return;
        }

        // Get settings
        $intensity = get_option('pwc_speedup_intensity', 'default');
        $allow_query_string = get_option('pwc_speedup_allow_query_string', '0');
        $allow_external_links = get_option('pwc_speedup_allow_external_links', '0');
        $use_whitelist = get_option('pwc_speedup_use_whitelist', '0');
        $mousedown_shortcut = get_option('pwc_speedup_mousedown_shortcut', '0');
        $speculation_rules = get_option('pwc_speedup_speculation_rules', 'auto');

        // Build data attributes for body tag
        add_filter('body_class', function($classes) use ($intensity, $allow_query_string, $allow_external_links, $use_whitelist, $mousedown_shortcut, $speculation_rules) {
            // Add attributes via inline script since WordPress doesn't provide body_attr filter by default
            add_action('wp_footer', function() use ($intensity, $allow_query_string, $allow_external_links, $use_whitelist, $mousedown_shortcut, $speculation_rules) {
                echo '<script>
                    (function() {
                        var body = document.body;
                        ';

                if ($intensity !== 'default') {
                    echo 'body.setAttribute("data-instant-intensity", "' . esc_js($intensity) . '");';
                }

                if ($allow_query_string === '1') {
                    echo 'body.setAttribute("data-instant-allow-query-string", "");';
                }

                if ($allow_external_links === '1') {
                    echo 'body.setAttribute("data-instant-allow-external-links", "");';
                }

                if ($use_whitelist === '1') {
                    echo 'body.setAttribute("data-instant-whitelist", "");';
                }

                if ($mousedown_shortcut === '1') {
                    echo 'body.setAttribute("data-instant-mousedown-shortcut", "");';
                }

                if ($speculation_rules !== 'auto') {
                    echo 'body.setAttribute("data-instant-specrules", "' . esc_js($speculation_rules) . '");';
                }

                echo '
                    })();
                </script>';
            }, 1);

            return $classes;
        });

        // Enqueue instant.page script as ES module
        wp_enqueue_script(
            'pwc-instantpage',
            PWC_SPEEDUP_PLUGIN_URL . 'assets/js/instantpage.js',
            array(),
            PWC_SPEEDUP_VERSION,
            array(
                'strategy' => 'defer',
                'in_footer' => true
            )
        );

        // Add module type attribute
        add_filter('script_loader_tag', function($tag, $handle, $src) {
            if ('pwc-instantpage' === $handle) {
                $tag = '<script type="module" src="' . esc_url($src) . '"></script>';
            }
            return $tag;
        }, 10, 3);
    }

    /**
     * Add settings link to plugins page
     */
    public function add_settings_link($links) {
        $settings_link = '<a href="' . admin_url('options-general.php?page=pwc-speeduptool') . '">' . __('Settings', 'pwc-speeduptool') . '</a>';
        array_unshift($links, $settings_link);
        return $links;
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            __('PWC SpeedUpTool Settings', 'pwc-speeduptool'),
            __('PWC SpeedUpTool', 'pwc-speeduptool'),
            'manage_options',
            'pwc-speeduptool',
            array($this, 'render_settings_page')
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('pwc_speedup_settings', 'pwc_speedup_enabled');
        register_setting('pwc_speedup_settings', 'pwc_speedup_intensity');
        register_setting('pwc_speedup_settings', 'pwc_speedup_allow_query_string');
        register_setting('pwc_speedup_settings', 'pwc_speedup_allow_external_links');
        register_setting('pwc_speedup_settings', 'pwc_speedup_use_whitelist');
        register_setting('pwc_speedup_settings', 'pwc_speedup_mousedown_shortcut');
        register_setting('pwc_speedup_settings', 'pwc_speedup_speculation_rules');

        add_settings_section(
            'pwc_speedup_main_section',
            __('Main Settings', 'pwc-speeduptool'),
            array($this, 'render_section_info'),
            'pwc-speeduptool'
        );

        add_settings_field(
            'pwc_speedup_enabled',
            __('Enable Plugin', 'pwc-speeduptool'),
            array($this, 'render_enabled_field'),
            'pwc-speeduptool',
            'pwc_speedup_main_section'
        );

        add_settings_field(
            'pwc_speedup_intensity',
            __('Intensity Mode', 'pwc-speeduptool'),
            array($this, 'render_intensity_field'),
            'pwc-speeduptool',
            'pwc_speedup_main_section'
        );

        add_settings_field(
            'pwc_speedup_allow_query_string',
            __('Allow Query Strings', 'pwc-speeduptool'),
            array($this, 'render_allow_query_string_field'),
            'pwc-speeduptool',
            'pwc_speedup_main_section'
        );

        add_settings_field(
            'pwc_speedup_allow_external_links',
            __('Allow External Links', 'pwc-speeduptool'),
            array($this, 'render_allow_external_links_field'),
            'pwc-speeduptool',
            'pwc_speedup_main_section'
        );

        add_settings_field(
            'pwc_speedup_use_whitelist',
            __('Use Whitelist Mode', 'pwc-speeduptool'),
            array($this, 'render_use_whitelist_field'),
            'pwc-speeduptool',
            'pwc_speedup_main_section'
        );

        add_settings_field(
            'pwc_speedup_mousedown_shortcut',
            __('Enable Mousedown Shortcut', 'pwc-speeduptool'),
            array($this, 'render_mousedown_shortcut_field'),
            'pwc-speeduptool',
            'pwc_speedup_main_section'
        );

        add_settings_field(
            'pwc_speedup_speculation_rules',
            __('Speculation Rules', 'pwc-speeduptool'),
            array($this, 'render_speculation_rules_field'),
            'pwc-speeduptool',
            'pwc_speedup_main_section'
        );
    }

    /**
     * Render section info
     */
    public function render_section_info() {
        echo '<p>' . __('Configure instant.page settings to optimize your website speed.', 'pwc-speeduptool') . '</p>';
        echo '<p><strong>' . __('Note:', 'pwc-speeduptool') . '</strong> ' . __('Changes take effect immediately on the frontend.', 'pwc-speeduptool') . '</p>';
    }

    /**
     * Render enabled field
     */
    public function render_enabled_field() {
        $value = get_option('pwc_speedup_enabled', '1');
        echo '<label><input type="checkbox" name="pwc_speedup_enabled" value="1" ' . checked($value, '1', false) . '> ';
        echo __('Enable instant.page prefetching', 'pwc-speeduptool') . '</label>';
        echo '<p class="description">' . __('Turn the plugin on or off without deactivating.', 'pwc-speeduptool') . '</p>';
    }

    /**
     * Render intensity field
     */
    public function render_intensity_field() {
        $value = get_option('pwc_speedup_intensity', 'default');
        ?>
        <select name="pwc_speedup_intensity">
            <option value="default" <?php selected($value, 'default'); ?>><?php _e('Default (65ms hover)', 'pwc-speeduptool'); ?></option>
            <option value="mousedown" <?php selected($value, 'mousedown'); ?>><?php _e('Mousedown', 'pwc-speeduptool'); ?></option>
            <option value="mousedown-only" <?php selected($value, 'mousedown-only'); ?>><?php _e('Mousedown Only', 'pwc-speeduptool'); ?></option>
            <option value="viewport" <?php selected($value, 'viewport'); ?>><?php _e('Viewport (Mobile)', 'pwc-speeduptool'); ?></option>
            <option value="viewport-all" <?php selected($value, 'viewport-all'); ?>><?php _e('Viewport (All Devices)', 'pwc-speeduptool'); ?></option>
        </select>
        <p class="description">
            <?php _e('Default: Prefetch on 65ms hover (recommended)<br>Mousedown: Prefetch when mouse button pressed<br>Mousedown Only: Only prefetch on mousedown, not hover<br>Viewport: Prefetch visible links on mobile devices<br>Viewport All: Prefetch all visible links', 'pwc-speeduptool'); ?>
        </p>
        <?php
    }

    /**
     * Render allow query string field
     */
    public function render_allow_query_string_field() {
        $value = get_option('pwc_speedup_allow_query_string', '0');
        echo '<label><input type="checkbox" name="pwc_speedup_allow_query_string" value="1" ' . checked($value, '1', false) . '> ';
        echo __('Allow prefetching URLs with query parameters', 'pwc-speeduptool') . '</label>';
        echo '<p class="description">' . __('Enable if your site uses query strings for navigation. May increase server load.', 'pwc-speeduptool') . '</p>';
    }

    /**
     * Render allow external links field
     */
    public function render_allow_external_links_field() {
        $value = get_option('pwc_speedup_allow_external_links', '0');
        echo '<label><input type="checkbox" name="pwc_speedup_allow_external_links" value="1" ' . checked($value, '1', false) . '> ';
        echo __('Allow prefetching external links', 'pwc-speeduptool') . '</label>';
        echo '<p class="description">' . __('Enable cross-origin prefetch (Chromium browsers only).', 'pwc-speeduptool') . '</p>';
    }

    /**
     * Render use whitelist field
     */
    public function render_use_whitelist_field() {
        $value = get_option('pwc_speedup_use_whitelist', '0');
        echo '<label><input type="checkbox" name="pwc_speedup_use_whitelist" value="1" ' . checked($value, '1', false) . '> ';
        echo __('Use whitelist mode', 'pwc-speeduptool') . '</label>';
        echo '<p class="description">' . __('Only prefetch links with data-instant attribute. Use for fine-grained control.', 'pwc-speeduptool') . '</p>';
    }

    /**
     * Render mousedown shortcut field
     */
    public function render_mousedown_shortcut_field() {
        $value = get_option('pwc_speedup_mousedown_shortcut', '0');
        echo '<label><input type="checkbox" name="pwc_speedup_mousedown_shortcut" value="1" ' . checked($value, '1', false) . '> ';
        echo __('Enable instant navigation (removes click delay)', 'pwc-speeduptool') . '</label>';
        echo '<p class="description">' . __('Navigate immediately on mousedown. May conflict with some JavaScript. Test thoroughly.', 'pwc-speeduptool') . '</p>';
    }

    /**
     * Render speculation rules field
     */
    public function render_speculation_rules_field() {
        $value = get_option('pwc_speedup_speculation_rules', 'auto');
        ?>
        <select name="pwc_speedup_speculation_rules">
            <option value="auto" <?php selected($value, 'auto'); ?>><?php _e('Auto (use if supported)', 'pwc-speeduptool'); ?></option>
            <option value="prefetch" <?php selected($value, 'prefetch'); ?>><?php _e('Prefetch Only', 'pwc-speeduptool'); ?></option>
            <option value="prerender" <?php selected($value, 'prerender'); ?>><?php _e('Prerender (Chromium only)', 'pwc-speeduptool'); ?></option>
            <option value="no" <?php selected($value, 'no'); ?>><?php _e('Disabled', 'pwc-speeduptool'); ?></option>
        </select>
        <p class="description">
            <?php _e('Speculation Rules API provides better prefetch performance on supported browsers (Chromium 103+, Safari 17.0+).', 'pwc-speeduptool'); ?>
        </p>
        <?php
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <div class="notice notice-info">
                <p>
                    <strong><?php _e('PWC SpeedUpTool', 'pwc-speeduptool'); ?></strong> <?php _e('makes your WordPress site feel instantly fast by preloading pages before visitors click.', 'pwc-speeduptool'); ?>
                </p>
                <p>
                    <?php _e('Based on instant.page v5.2.0 with enhanced security and performance. Learn more at', 'pwc-speeduptool'); ?>
                    <a href="https://prowebcare.com" target="_blank">prowebcare.com</a>
                </p>
            </div>

            <form action="options.php" method="post">
                <?php
                settings_fields('pwc_speedup_settings');
                do_settings_sections('pwc-speeduptool');
                submit_button(__('Save Settings', 'pwc-speeduptool'));
                ?>
            </form>

            <hr>

            <h2><?php _e('How to Use', 'pwc-speeduptool'); ?></h2>
            <ol>
                <li><?php _e('Enable the plugin above and save settings', 'pwc-speeduptool'); ?></li>
                <li><?php _e('Visit your website and hover over links - they will be prefetched automatically', 'pwc-speeduptool'); ?></li>
                <li><?php _e('Open browser DevTools > Network tab to see prefetch requests', 'pwc-speeduptool'); ?></li>
                <li><?php _e('Adjust intensity mode based on your site type and traffic', 'pwc-speeduptool'); ?></li>
            </ol>

            <h3><?php _e('Advanced Usage', 'pwc-speeduptool'); ?></h3>
            <p><?php _e('Disable prefetch for specific links:', 'pwc-speeduptool'); ?></p>
            <code>&lt;a href="/page" data-no-instant&gt;No Prefetch&lt;/a&gt;</code>

            <p><?php _e('In whitelist mode, only prefetch specific links:', 'pwc-speeduptool'); ?></p>
            <code>&lt;a href="/page" data-instant&gt;Prefetch This&lt;/a&gt;</code>

            <h3><?php _e('Performance Tips', 'pwc-speeduptool'); ?></h3>
            <ul>
                <li><?php _e('Start with default settings and test on your site', 'pwc-speeduptool'); ?></li>
                <li><?php _e('Use "Mousedown" mode for blogs and content sites (moderate traffic)', 'pwc-speeduptool'); ?></li>
                <li><?php _e('Use "Viewport" mode for mobile-heavy sites', 'pwc-speeduptool'); ?></li>
                <li><?php _e('Avoid "Viewport All" on sites with many links - may increase server load', 'pwc-speeduptool'); ?></li>
                <li><?php _e('Test with browser DevTools to verify prefetch is working', 'pwc-speeduptool'); ?></li>
            </ul>

            <hr>

            <p>
                <strong><?php _e('Need help?', 'pwc-speeduptool'); ?></strong>
                <?php _e('Visit', 'pwc-speeduptool'); ?> <a href="https://prowebcare.com" target="_blank">https://prowebcare.com</a>
            </p>
        </div>
        <?php
    }
}

/**
 * Activation hook
 */
function pwc_speedup_activate() {
    // Set default options
    add_option('pwc_speedup_enabled', '1');
    add_option('pwc_speedup_intensity', 'default');
    add_option('pwc_speedup_allow_query_string', '0');
    add_option('pwc_speedup_allow_external_links', '0');
    add_option('pwc_speedup_use_whitelist', '0');
    add_option('pwc_speedup_mousedown_shortcut', '0');
    add_option('pwc_speedup_speculation_rules', 'auto');

    // Clear any caches
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
}
register_activation_hook(PWC_SPEEDUP_PLUGIN_FILE, 'pwc_speedup_activate');

/**
 * Deactivation hook
 */
function pwc_speedup_deactivate() {
    // Clear any caches
    if (function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
}
register_deactivation_hook(PWC_SPEEDUP_PLUGIN_FILE, 'pwc_speedup_deactivate');

/**
 * Initialize plugin
 */
function pwc_speedup_init() {
    return PWC_SpeedUpTool::get_instance();
}

// Start the plugin
pwc_speedup_init();
