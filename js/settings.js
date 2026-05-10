document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  setupSidebar();
  setupLogout();
  populateUserInfo();

  // Password change form
  document.getElementById('passwordForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('savePasswordBtn');
    const newPwd = document.getElementById('newPassword').value;
    const confirmPwd = document.getElementById('confirmNewPassword').value;

    if (newPwd !== confirmPwd) {
      showAlert('passwordAlert', 'Passwords do not match.');
      return;
    }

    setButtonLoading(btn, true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: document.getElementById('currentPassword').value,
        newPassword: newPwd,
      });
      showAlert('passwordAlert', 'Password changed successfully!', 'success');
      e.target.reset();
    } catch (err) {
      showAlert('passwordAlert', err.message);
    } finally {
      setButtonLoading(btn, false);
    }
  });
});
