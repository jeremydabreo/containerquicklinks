<?php
/**
 * Container Quicklinks - Helper functions
 */

define('CQL_CONFIG_FILE', '/boot/config/plugins/container-quicklinks/links.json');

/**
 * Load saved links from JSON config on the boot drive.
 * Returns an array of link objects:
 *   [{ id, container_name, label, url, icon, enabled }, ...]
 */
function cql_get_links(): array {
    if (!file_exists(CQL_CONFIG_FILE)) {
        return [];
    }
    $json = file_get_contents(CQL_CONFIG_FILE);
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

/**
 * Save links array back to JSON config.
 */
function cql_save_links(array $links): bool {
    $dir = dirname(CQL_CONFIG_FILE);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    return file_put_contents(CQL_CONFIG_FILE, json_encode($links, JSON_PRETTY_PRINT)) !== false;
}

/**
 * Get running Docker containers from Unraid's internal state.
 * Returns array of [ name => display_name ]
 */
function cql_get_docker_containers(): array {
    $containers = [];

    // Unraid stores docker container info via the docker API socket
    // We parse the names list from `docker ps`
    $output = shell_exec('docker ps --format "{{.Names}}\t{{.Image}}\t{{.Ports}}" 2>/dev/null');
    if (empty($output)) {
        return $containers;
    }

    foreach (explode("\n", trim($output)) as $line) {
        if (empty($line)) continue;
        $parts = explode("\t", $line);
        $name  = trim($parts[0] ?? '');
        if ($name) {
            $containers[] = [
                'name'  => $name,
                'image' => trim($parts[1] ?? ''),
                'ports' => trim($parts[2] ?? ''),
            ];
        }
    }

    return $containers;
}

/**
 * Guess a WebUI URL for a container by inspecting its port mappings.
 * Returns something like http://[SERVER_IP]:[HOST_PORT] or empty string.
 */
function cql_guess_url(array $container): string {
    $serverIp = trim(shell_exec("ip route get 1 | awk '{print $NF; exit}' 2>/dev/null") ?? '');
    if (empty($serverIp)) {
        $serverIp = $_SERVER['SERVER_ADDR'] ?? 'localhost';
    }

    $ports = $container['ports'] ?? '';
    // e.g.  0.0.0.0:8096->8096/tcp
    if (preg_match('/0\.0\.0\.0:(\d+)->(\d+)\/tcp/', $ports, $m)) {
        $hostPort = $m[1];
        $proto    = ($hostPort == 443 || $hostPort == 8443) ? 'https' : 'http';
        return "{$proto}://{$serverIp}:{$hostPort}";
    }
    return '';
}

/**
 * Handle AJAX / POST actions from the settings page.
 */
function cql_handle_action(): void {
    $action = $_POST['action'] ?? $_GET['action'] ?? '';

    header('Content-Type: application/json');

    switch ($action) {
        case 'get_links':
            echo json_encode(['links' => cql_get_links()]);
            break;

        case 'save_links':
            $raw   = $_POST['links'] ?? '[]';
            $links = json_decode($raw, true);
            if (!is_array($links)) {
                http_response_code(400);
                echo json_encode(['error' => 'Invalid data']);
                exit;
            }
            // Sanitise each link
            $clean = array_map(function ($l) {
                return [
                    'id'             => preg_replace('/[^a-z0-9_-]/i', '', $l['id'] ?? uniqid('lnk_')),
                    'container_name' => htmlspecialchars(strip_tags($l['container_name'] ?? '')),
                    'label'          => htmlspecialchars(strip_tags($l['label'] ?? '')),
                    'url'            => filter_var($l['url'] ?? '', FILTER_SANITIZE_URL),
                    'icon'           => htmlspecialchars(strip_tags($l['icon'] ?? '')),
                    'enabled'        => (bool)($l['enabled'] ?? true),
                    'order'          => (int)($l['order'] ?? 0),
                ];
            }, $links);
            usort($clean, fn($a, $b) => $a['order'] - $b['order']);
            cql_save_links($clean);
            echo json_encode(['ok' => true, 'count' => count($clean)]);
            break;

        case 'get_containers':
            echo json_encode(['containers' => cql_get_docker_containers()]);
            break;

        default:
            http_response_code(400);
            echo json_encode(['error' => 'Unknown action']);
    }
    exit;
}
