<?php
/**
 * Container Quicklinks - AJAX handler
 * URL: /plugins/container-quicklinks/ajax.php
 */

require_once __DIR__ . '/include/helpers.php';

// Only allow POST or GET from local
cql_handle_action();
