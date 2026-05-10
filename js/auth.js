// ============================================================
// js/auth.js — Login & Signup Logic
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect to dashboard
  if (getToken()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // ── Login Form ─────────────────────────────────────────────
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('loginBtn');
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      setButtonLoading(btn, true);
      try {
        const data = await api.post('/auth/login', { email, password });
        saveAuth(data.token, data.user);
        window.location.href = 'dashboard.html';
      } catch (err) {
        showAlert('alertBox', err.message);
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // ── Signup Form ────────────────────────────────────────────
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('signupBtn');
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirm = document.getElementById('confirmPassword').value;

      if (password !== confirm) {
        showAlert('alertBox', 'Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        showAlert('alertBox', 'Password must be at least 6 characters.');
        return;
      }

      setButtonLoading(btn, true);
      try {
        const data = await api.post('/auth/signup', { name, email, password });
        saveAuth(data.token, data.user);
        window.location.href = 'dashboard.html';
      } catch (err) {
        showAlert('alertBox', err.message);
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }
});
