<?php
/**
 * Container Quicklinks - Settings Page
 * Rendered inside Unraid's standard page frame.
 */
if (!defined('ABSPATH')) {
    // Prevent direct access outside Unraid page system
    exit;
}
?>
<link rel="stylesheet" href="/plugins/container-quicklinks/css/settings.css">

<div id="cql-app">

  <!-- ── Header ────────────────────────────────────────────── -->
  <div class="cql-header">
    <h2>🔗 Container Quicklinks</h2>
    <p class="cql-subtitle">Add links to your containers in the Unraid nav bar. Drag rows to reorder.</p>
  </div>

  <!-- ── Toolbar ───────────────────────────────────────────── -->
  <div class="cql-toolbar">
    <button id="cql-add-btn" class="cql-btn cql-btn-primary">
      + Add Link
    </button>
    <button id="cql-save-btn" class="cql-btn cql-btn-success">
      ✓ Save Changes
    </button>
    <span id="cql-status" class="cql-status"></span>
  </div>

  <!-- ── Add / Edit Modal ──────────────────────────────────── -->
  <div id="cql-modal" class="cql-modal hidden">
    <div class="cql-modal-box">
      <h3 id="cql-modal-title">Add Link</h3>

      <label>Container
        <select id="cql-sel-container">
          <option value="">— pick a container —</option>
        </select>
      </label>

      <label>Label (shown in nav)
        <input type="text" id="cql-inp-label" placeholder="e.g. Jellyfin">
      </label>

      <label>URL
        <input type="url" id="cql-inp-url" placeholder="http://192.168.1.x:8096">
        <small id="cql-url-hint" class="cql-hint"></small>
      </label>

      <label>Icon (emoji or leave blank)
        <input type="text" id="cql-inp-icon" placeholder="🎬" maxlength="4">
      </label>

      <div class="cql-modal-actions">
        <button id="cql-modal-cancel" class="cql-btn">Cancel</button>
        <button id="cql-modal-ok"     class="cql-btn cql-btn-primary">Add</button>
      </div>
    </div>
  </div>

  <!-- ── Links Table ───────────────────────────────────────── -->
  <div class="cql-table-wrap">
    <table id="cql-table">
      <thead>
        <tr>
          <th class="col-drag"></th>
          <th class="col-icon">Icon</th>
          <th class="col-label">Label</th>
          <th class="col-container">Container</th>
          <th class="col-url">URL</th>
          <th class="col-enabled">Enabled</th>
          <th class="col-actions">Actions</th>
        </tr>
      </thead>
      <tbody id="cql-tbody">
        <!-- rows injected by JS -->
      </tbody>
    </table>
    <p id="cql-empty" class="cql-empty hidden">No links yet — click <strong>+ Add Link</strong> to get started.</p>
  </div>

  <!-- ── Live Preview ──────────────────────────────────────── -->
  <div class="cql-preview-wrap">
    <h4>Nav Bar Preview</h4>
    <div class="cql-nav-preview">
      <span class="cql-nav-static">DASHBOARD</span>
      <span class="cql-nav-static">MAIN</span>
      <span class="cql-nav-static">SHARES</span>
      <span class="cql-nav-static">DOCKER</span>
      <span class="cql-nav-divider">|</span>
      <span id="cql-preview-links"></span>
    </div>
  </div>

</div><!-- /#cql-app -->

<script src="/plugins/container-quicklinks/js/settings.js"></script>
