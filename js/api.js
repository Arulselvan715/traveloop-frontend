// ============================================================
// js/api.js — Centralized Fetch API Helper + UI Utilities
// ============================================================

// ⚠️ UPDATE THIS to your Render backend URL after deployment
const API_BASE = 'https://traveloop-backend-jzyh.onrender.com/api';

// ── Auth Helpers ─────────────────────────────────────────────
function getToken() { return localStorage.getItem('traveloop_token'); }
function getUser() {
  const u = localStorage.getItem('traveloop_user');
  return u ? JSON.parse(u) : null;
}
function saveAuth(token, user) {
  localStorage.setItem('traveloop_token', token);
  localStorage.setItem('traveloop_user', JSON.stringify(user));
}

// ── Theme System ──────────────────────────────────────────────
function loadTheme() {
  const theme = localStorage.getItem('traveloop_theme') || 'default';
  document.body.className = theme === 'default' ? '' : 'theme-' + theme;
}
function setTheme(themeName) {
  localStorage.setItem('traveloop_theme', themeName);
  loadTheme();
}
// Automatically load theme on all pages
document.addEventListener('DOMContentLoaded', loadTheme);
function showLogoutModal() {
  let modal = document.getElementById('customLogoutModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'customLogoutModal';
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Log Out</h2>
          <button class="modal-close" onclick="document.getElementById('customLogoutModal').classList.remove('active')">✕</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to log out of Traveloop?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('customLogoutModal').classList.remove('active')">Cancel</button>
          <button class="btn btn-primary" onclick="performLogout()">Yes, Log Out</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  } else {
    modal.classList.add('active');
  }
}

function performLogout() {
  localStorage.removeItem('traveloop_token');
  localStorage.removeItem('traveloop_user');
  window.location.href = 'login.html';
}

function logout() {
  showLogoutModal();
}
function requireAuth() {
  if (!getToken()) { window.location.href = 'login.html'; return false; }
  return true;
}

// ── Core Fetch Wrapper ────────────────────────────────────────
async function apiFetch(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${API_BASE}${endpoint}`, options);

  if (response.status === 401) { logout(); return; }

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'An error occurred.');
  return data;
}

const api = {
  get:    (ep)       => apiFetch(ep, 'GET'),
  post:   (ep, body) => apiFetch(ep, 'POST', body),
  put:    (ep, body) => apiFetch(ep, 'PUT', body),
  patch:  (ep, body) => apiFetch(ep, 'PATCH', body),
  delete: (ep)       => apiFetch(ep, 'DELETE'),
};

// ── UI Helpers ────────────────────────────────────────────────
function showAlert(elementId, message, type = 'error') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  el.className = `alert alert-${type} show`;
  if (type !== 'error') setTimeout(() => el.classList.remove('show'), 5000);
}

function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Loading...';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || 'Submit';
    btn.disabled = false;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function tripDays(startDate, endDate) {
  if (!startDate || !endDate) return null;
  const diff = new Date(endDate) - new Date(startDate);
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
}

function toInputDate(isoStr) {
  if (!isoStr) return '';
  return isoStr.split('T')[0];
}

function categoryBadge(cat) {
  const map = {
    'Sightseeing': 'badge-indigo', 'Food': 'badge-amber', 'Adventure': 'badge-rose',
    'Shopping': 'badge-cyan', 'Culture': 'badge-emerald', 'Transport': 'badge-indigo', 'Other': 'badge-cyan'
  };
  return `<span class="badge ${map[cat] || 'badge-cyan'}">${escapeHtml(cat)}</span>`;
}

// ── Modal Helpers ─────────────────────────────────────────────
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('active');
}
function setupModalClosers() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });
  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal-overlay')?.classList.remove('active'));
  });
}

// ── Sidebar ───────────────────────────────────────────────────
function setupSidebar() {
  const hamburger = document.getElementById('hamburger');
  const sidebar = document.querySelector('.sidebar');
  if (!hamburger || !sidebar) return;
  hamburger.addEventListener('click', () => sidebar.classList.toggle('mobile-open'));
  document.addEventListener('click', e => {
    if (!sidebar.contains(e.target) && e.target !== hamburger)
      sidebar.classList.remove('mobile-open');
  });
}

function setupLogout() {
  document.getElementById('logoutBtn')?.addEventListener('click', logout);
}

function populateUserInfo() {
  const user = getUser();
  if (!user) return;
  const nameEl = document.getElementById('sidebarUserName');
  const emailEl = document.getElementById('sidebarUserEmail');
  const avatarEl = document.getElementById('sidebarAvatar');
  if (nameEl) nameEl.textContent = user.name;
  if (emailEl) emailEl.textContent = user.email;
  if (avatarEl) {
    if (user.profile_image) {
      avatarEl.innerHTML = `<img src="${escapeHtml(user.profile_image)}" alt="avatar" onerror="this.parentNode.textContent='${user.name.charAt(0).toUpperCase()}'">`;
    } else {
      avatarEl.textContent = user.name.charAt(0).toUpperCase();
    }
  }
}
