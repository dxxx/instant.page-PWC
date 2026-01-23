<?php
/**
 * Uninstall PWC SpeedUpTool
 *
 * @package PWC_SpeedUpTool
 */

// Exit if accessed directly
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

// Delete plugin options
delete_option('pwc_speedup_enabled');
delete_option('pwc_speedup_intensity');
delete_option('pwc_speedup_allow_query_string');
delete_option('pwc_speedup_allow_external_links');
delete_option('pwc_speedup_use_whitelist');
delete_option('pwc_speedup_mousedown_shortcut');
delete_option('pwc_speedup_speculation_rules');

// Clear any caches
if (function_exists('wp_cache_flush')) {
    wp_cache_flush();
}
