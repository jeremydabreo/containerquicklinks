# Container Quicklinks — Unraid Plugin

Adds quick-access links for your Docker containers directly into the Unraid navigation bar. Configure everything from a simple drag-and-drop settings page.

---

## Installation

### Option A — Community Applications (recommended when published)
Search for **Container Quicklinks** in the Apps tab.

### Option B — Manual install via Unraid terminal

```bash
# SSH into your Unraid server, then:

PLUGIN_URL="https://raw.githubusercontent.com/YOUR_GITHUB/container-quicklinks/main/container-quicklinks.plg"
plugin install "$PLUGIN_URL"
```

### Option C — Copy files directly (dev/testing)

```bash
# From your workstation, copy the plugin folder to your Unraid server:
scp -r ./container-quicklinks root@UNRAID_IP:/usr/local/emhttp/plugins/

# Make the event hook executable:
ssh root@UNRAID_IP chmod +x /usr/local/emhttp/plugins/container-quicklinks/event/display

# Create the config directory on the boot drive:
ssh root@UNRAID_IP mkdir -p /boot/config/plugins/container-quicklinks
```

---

## File Structure

```
container-quicklinks/
├── container-quicklinks.plg       ← Plugin manifest (installer)
├── ajax.php                       ← AJAX endpoint (get/save links)
├── event/
│   └── display                    ← Hook: injects nav script on every page
├── include/
│   ├── helpers.php                ← PHP helpers (read/write config, docker API)
│   └── settings_page.php          ← Settings page HTML template
├── css/
│   └── settings.css               ← Settings page styles
└── js/
    ├── settings.js                ← Settings page logic (drag-sort, CRUD, AJAX)
    └── nav-inject.js              ← Injected on every page — adds links to nav bar
```

Config is stored at: `/boot/config/plugins/container-quicklinks/links.json`
(on the boot drive so it survives Unraid updates)

---

## Usage

1. Go to **Settings → Container Quicklinks** in the Unraid UI
2. Click **+ Add Link**
3. Pick a container from the dropdown — the URL is auto-detected from port mappings
4. Give it a label and optional emoji icon
5. Drag rows to reorder
6. Click **✓ Save Changes**
7. Reload any Unraid page — your links appear in the nav bar

---

## How the Nav Injection Works

- The `event/display` script is called by Unraid's `emhttp` after each page render
- It emits a `<script>` tag loading `nav-inject.js`
- `nav-inject.js` fetches your saved links from `ajax.php` and appends them to the nav `<ul>`
- Links open in a new tab

---

## Troubleshooting

**Links don't appear in the nav bar**
- Make sure `/usr/local/emhttp/plugins/container-quicklinks/event/display` is executable (`chmod +x`)
- Check that you clicked **Save Changes** after adding links
- Open browser DevTools → Console and look for `[CQL]` messages

**URL not auto-detected**
- Only containers with a `0.0.0.0:PORT->PORT/tcp` port mapping are detected
- Enter the URL manually for containers using host networking

**Plugin page not showing in Settings**
- The `.page` file must be at `/usr/local/emhttp/plugins/container-quicklinks/container-quicklinks.page`
- Restart Unraid's management interface: `service emhttpd restart` (or reboot)

---

## Development Notes

- Config JSON lives on `/boot` so it persists across Unraid OS upgrades
- The plugin uses zero external dependencies — plain PHP + vanilla JS
- Tested on Unraid 7.2.x
