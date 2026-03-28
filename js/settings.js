/**
 * Container Quicklinks — Settings Page JS
 * Handles: load links, add/edit/delete, drag-to-sort, save, live preview
 */

(function () {
  'use strict';

  const AJAX_URL = '/plugins/container-quicklinks/ajax.php';

  // ── State ─────────────────────────────────────────────────
  let links      = [];        // { id, container_name, label, url, icon, enabled, order }
  let containers = [];        // [{ name, image, ports }]
  let editIndex  = null;      // null = adding, number = editing
  let dragSrcIdx = null;

  // ── DOM refs ──────────────────────────────────────────────
  const tbody       = document.getElementById('cql-tbody');
  const emptyMsg    = document.getElementById('cql-empty');
  const modal       = document.getElementById('cql-modal');
  const modalTitle  = document.getElementById('cql-modal-title');
  const selContainer= document.getElementById('cql-sel-container');
  const inpLabel    = document.getElementById('cql-inp-label');
  const inpUrl      = document.getElementById('cql-inp-url');
  const inpIcon     = document.getElementById('cql-inp-icon');
  const urlHint     = document.getElementById('cql-url-hint');
  const statusEl    = document.getElementById('cql-status');
  const previewEl   = document.getElementById('cql-preview-links');

  // ── Boot ──────────────────────────────────────────────────
  loadContainers().then(loadLinks);

  document.getElementById('cql-add-btn').addEventListener('click', openAddModal);
  document.getElementById('cql-save-btn').addEventListener('click', saveAll);
  document.getElementById('cql-modal-cancel').addEventListener('click', closeModal);
  document.getElementById('cql-modal-ok').addEventListener('click', commitModal);
  selContainer.addEventListener('change', onContainerChange);

  // Close modal on backdrop click
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // ── Data loading ──────────────────────────────────────────
  async function loadContainers() {
    try {
      const res  = await fetch(AJAX_URL + '?action=get_containers');
      const data = await res.json();
      containers = data.containers || [];
      // Populate select
      selContainer.innerHTML = '<option value="">— pick a container —</option>';
      containers.forEach(c => {
        const opt = document.createElement('option');
        opt.value       = c.name;
        opt.textContent = c.name + (c.image ? ` (${c.image.split(':')[0]})` : '');
        opt.dataset.ports = c.ports || '';
        selContainer.appendChild(opt);
      });
    } catch (e) {
      console.warn('CQL: could not load containers', e);
    }
  }

  async function loadLinks() {
    try {
      const res  = await fetch(AJAX_URL + '?action=get_links');
      const data = await res.json();
      links = data.links || [];
    } catch (e) {
      links = [];
    }
    renderTable();
    renderPreview();
  }

  // ── Render ────────────────────────────────────────────────
  function renderTable() {
    tbody.innerHTML = '';
    if (links.length === 0) {
      emptyMsg.classList.remove('hidden');
      return;
    }
    emptyMsg.classList.add('hidden');

    links.forEach((lnk, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.idx = idx;
      tr.draggable   = true;

      tr.innerHTML = `
        <td><span class="cql-drag-handle" title="Drag to reorder">⠿</span></td>
        <td class="cql-icon-cell">${escHtml(lnk.icon || '🔗')}</td>
        <td>${escHtml(lnk.label)}</td>
        <td>${escHtml(lnk.container_name)}</td>
        <td class="cql-url-cell" title="${escHtml(lnk.url)}">${escHtml(lnk.url)}</td>
        <td style="text-align:center">
          <label class="cql-toggle">
            <input type="checkbox" ${lnk.enabled ? 'checked' : ''} data-idx="${idx}" class="cql-chk-enabled">
            <span class="cql-toggle-slider"></span>
          </label>
        </td>
        <td style="text-align:right">
          <button class="cql-btn cql-btn-sm" data-edit="${idx}">Edit</button>
          <button class="cql-btn cql-btn-sm cql-btn-danger" data-del="${idx}">✕</button>
        </td>
      `;

      // Toggle enabled
      tr.querySelector('.cql-chk-enabled').addEventListener('change', e => {
        links[+e.target.dataset.idx].enabled = e.target.checked;
        renderPreview();
      });

      // Edit / Delete
      tr.querySelector('[data-edit]').addEventListener('click', e => openEditModal(+e.currentTarget.dataset.edit));
      tr.querySelector('[data-del]').addEventListener('click', e => deleteLink(+e.currentTarget.dataset.del));

      // Drag events
      tr.addEventListener('dragstart', onDragStart);
      tr.addEventListener('dragover',  onDragOver);
      tr.addEventListener('drop',      onDrop);
      tr.addEventListener('dragend',   onDragEnd);

      tbody.appendChild(tr);
    });
  }

  function renderPreview() {
    previewEl.innerHTML = '';
    links.filter(l => l.enabled).forEach(lnk => {
      const a = document.createElement('a');
      a.className = 'cql-preview-link';
      a.href      = lnk.url || '#';
      a.target    = '_blank';
      a.innerHTML = `<span>${escHtml(lnk.icon || '🔗')}</span><span>${escHtml(lnk.label)}</span>`;
      previewEl.appendChild(a);
    });
  }

  // ── Modal ─────────────────────────────────────────────────
  function openAddModal() {
    editIndex        = null;
    modalTitle.textContent = 'Add Link';
    document.getElementById('cql-modal-ok').textContent = 'Add';
    selContainer.value = '';
    inpLabel.value     = '';
    inpUrl.value       = '';
    inpIcon.value      = '';
    urlHint.textContent = '';
    modal.classList.remove('hidden');
    inpLabel.focus();
  }

  function openEditModal(idx) {
    editIndex = idx;
    const lnk = links[idx];
    modalTitle.textContent = 'Edit Link';
    document.getElementById('cql-modal-ok').textContent = 'Save';
    selContainer.value = lnk.container_name;
    inpLabel.value     = lnk.label;
    inpUrl.value       = lnk.url;
    inpIcon.value      = lnk.icon || '';
    urlHint.textContent = '';
    modal.classList.remove('hidden');
    inpLabel.focus();
  }

  function closeModal() {
    modal.classList.add('hidden');
  }

  function commitModal() {
    const label = inpLabel.value.trim();
    const url   = inpUrl.value.trim();
    if (!label) { inpLabel.focus(); flash(inpLabel); return; }
    if (!url)   { inpUrl.focus();   flash(inpUrl);   return; }

    const lnk = {
      id:             (editIndex !== null ? links[editIndex].id : 'lnk_' + Date.now()),
      container_name: selContainer.value,
      label,
      url,
      icon:    inpIcon.value.trim() || '🔗',
      enabled: editIndex !== null ? links[editIndex].enabled : true,
      order:   editIndex !== null ? links[editIndex].order   : links.length,
    };

    if (editIndex !== null) {
      links[editIndex] = lnk;
    } else {
      links.push(lnk);
    }

    closeModal();
    renderTable();
    renderPreview();
  }

  function onContainerChange() {
    const name = selContainer.value;
    if (!name) { urlHint.textContent = ''; return; }

    // Auto-fill label if empty
    if (!inpLabel.value) inpLabel.value = name;

    // Try to guess URL from port mappings
    const c = containers.find(c => c.name === name);
    if (!c) return;

    const ports = c.ports || '';
    const m = ports.match(/0\.0\.0\.0:(\d+)/);
    if (m) {
      const port  = m[1];
      const proto = (port === '443' || port === '8443') ? 'https' : 'http';
      const host  = window.location.hostname;
      const guessedUrl = `${proto}://${host}:${port}`;
      inpUrl.value = guessedUrl;
      urlHint.textContent = '✓ URL auto-detected from port mapping';
    } else {
      urlHint.textContent = 'No port mapping detected — enter URL manually';
    }
  }

  // ── Delete ────────────────────────────────────────────────
  function deleteLink(idx) {
    links.splice(idx, 1);
    renderTable();
    renderPreview();
  }

  // ── Save ──────────────────────────────────────────────────
  async function saveAll() {
    links.forEach((l, i) => { l.order = i; });

    try {
      const res  = await fetch(AJAX_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    'action=save_links&links=' + encodeURIComponent(JSON.stringify(links)),
      });
      const data = await res.json();
      if (data.ok) {
        showStatus('✓ Saved! Reload any Unraid page to see changes.');
      } else {
        showStatus('⚠ Save failed: ' + (data.error || 'unknown error'));
      }
    } catch (e) {
      showStatus('⚠ Network error — check console');
      console.error(e);
    }
  }

  function showStatus(msg) {
    statusEl.textContent = msg;
    statusEl.classList.add('visible');
    setTimeout(() => statusEl.classList.remove('visible'), 4000);
  }

  // ── Drag & Drop sorting ───────────────────────────────────
  function onDragStart(e) {
    dragSrcIdx = +this.dataset.idx;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    document.querySelectorAll('#cql-tbody tr').forEach(r => r.classList.remove('drag-over'));
    this.classList.add('drag-over');
    return false;
  }
  function onDrop(e) {
    e.preventDefault();
    const targetIdx = +this.dataset.idx;
    if (dragSrcIdx === null || dragSrcIdx === targetIdx) return;
    const moved = links.splice(dragSrcIdx, 1)[0];
    links.splice(targetIdx, 0, moved);
    renderTable();
    renderPreview();
    return false;
  }
  function onDragEnd() {
    document.querySelectorAll('#cql-tbody tr').forEach(r => {
      r.classList.remove('dragging', 'drag-over');
    });
    dragSrcIdx = null;
  }

  // ── Helpers ───────────────────────────────────────────────
  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function flash(el) {
    el.style.borderColor = '#e74c3c';
    setTimeout(() => { el.style.borderColor = ''; }, 1200);
  }

})();
