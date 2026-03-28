/**
 * Container Quicklinks — Nav Bar Injector
 * Loaded on every Unraid page via the CustomCSS plugin hook or
 * a <script> tag added to /usr/local/emhttp/plugins/container-quicklinks/event/display.
 *
 * Reads the saved links from the plugin's JSON endpoint and
 * inserts styled anchor tags into Unraid's top navigation bar.
 */

(function () {
  'use strict';

  const AJAX_URL  = '/plugins/container-quicklinks/ajax.php?action=get_links';
  const NAV_SEL   = '#nav-bar, nav#menu, .navbar ul, header nav ul'; // Unraid 7 selectors
  const INJECT_ID = 'cql-nav-links';

  // Don't double-inject
  if (document.getElementById(INJECT_ID)) return;

  // Inject CSS inline so we don't need an extra request
  const style = document.createElement('style');
  style.textContent = `
    #cql-nav-links {
      display: inline-flex;
      align-items: center;
      gap: 0;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    #cql-nav-links li {
      display: inline-block;
    }
    #cql-nav-links a {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 0 14px;
      height: 100%;
      line-height: inherit;
      color: inherit;
      text-decoration: none;
      font-size: inherit;
      font-weight: 700;
      letter-spacing: .05em;
      white-space: nowrap;
      transition: color .15s;
    }
    #cql-nav-links a:hover {
      color: #ff6b35;   /* Unraid accent */
    }
    .cql-nav-sep {
      display: inline-block;
      width: 1px;
      height: 14px;
      background: rgba(255,255,255,.2);
      margin: 0 6px;
      vertical-align: middle;
    }
  `;
  document.head.appendChild(style);

  // Fetch links then inject
  fetch(AJAX_URL)
    .then(r => r.json())
    .then(data => {
      const links = (data.links || []).filter(l => l.enabled);
      if (!links.length) return;

      injectWhenReady(links);
    })
    .catch(err => console.warn('[CQL] Could not load quicklinks:', err));

  function injectWhenReady(links) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => inject(links));
    } else {
      inject(links);
    }
  }

  function inject(links) {
    // Find the nav bar — try multiple Unraid versions
    const nav = findNav();
    if (!nav) {
      // Retry after a short delay (page still rendering)
      setTimeout(() => inject(links), 500);
      return;
    }

    // Build the link list
    const ul = document.createElement('ul');
    ul.id = INJECT_ID;

    // Visual separator before our links
    const sep = document.createElement('span');
    sep.className = 'cql-nav-sep';
    nav.appendChild(sep);

    links.forEach(lnk => {
      const li = document.createElement('li');
      const a  = document.createElement('a');
      a.href        = lnk.url;
      a.target      = '_blank';
      a.rel         = 'noopener noreferrer';
      a.title       = lnk.label;
      a.innerHTML   = `<span>${lnk.icon || ''}</span><span>${escHtml(lnk.label)}</span>`;
      li.appendChild(a);
      ul.appendChild(li);
    });

    nav.appendChild(ul);
  }

  function findNav() {
    // Unraid 7 uses a <nav> with id="nav-bar" or similar
    const candidates = [
      document.getElementById('nav-bar'),
      document.querySelector('nav.navbar'),
      document.querySelector('header nav'),
      document.querySelector('#menu'),
      // Fallback: find the UL that contains "DOCKER" or "DASHBOARD" links
      findNavByContent(),
    ];
    return candidates.find(Boolean) || null;
  }

  function findNavByContent() {
    const uls = document.querySelectorAll('nav ul, header ul, .navbar ul');
    for (const ul of uls) {
      const text = ul.textContent.toUpperCase();
      if (text.includes('DOCKER') || text.includes('DASHBOARD') || text.includes('SHARES')) {
        return ul;
      }
    }
    return null;
  }

  function escHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

})();
