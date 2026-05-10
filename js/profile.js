// ============================================================
// js/profile.js — User Profile Page
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  setupSidebar();
  setupLogout();
  populateUserInfo();

  await loadProfile();

  // Profile update form
  document.getElementById('profileForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('saveProfileBtn');
    setButtonLoading(btn, true);
    try {
      const data = await api.put('/auth/profile', {
        name: document.getElementById('profileName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        profile_image: document.getElementById('profileImage').value.trim() || null,
      });
      saveAuth(getToken(), data.user);
      populateUserInfo();
      showAlert('profileAlert', 'Profile updated successfully!', 'success');
    } catch (err) {
      showAlert('profileAlert', err.message);
    } finally {
      setButtonLoading(btn, false);
    }
  });


  // Preview profile image on input
  document.getElementById('profileImage')?.addEventListener('input', function () {
    const preview = document.getElementById('avatarPreview');
    if (preview) {
      if (this.value) {
        preview.innerHTML = `<img src="${escapeHtml(this.value)}" alt="avatar" onerror="this.parentNode.textContent='?'">`;
      } else {
        const user = getUser();
        preview.textContent = user?.name?.charAt(0).toUpperCase() || '?';
      }
    }
  });
});

async function loadProfile() {
  try {
    const user = await api.get('/auth/me');
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profileImage').value = user.profile_image || '';
    
    const nameEl2 = document.getElementById('sidebarUserName2');
    if (nameEl2) nameEl2.textContent = user.name;

    const preview = document.getElementById('avatarPreview');
    if (preview) {
      if (user.profile_image) {
        preview.innerHTML = `<img src="${escapeHtml(user.profile_image)}" alt="avatar" onerror="this.parentNode.textContent='${user.name.charAt(0).toUpperCase()}'">`;
      } else {
        preview.textContent = user.name?.charAt(0).toUpperCase() || '?';
      }
    }

    const memberSince = document.getElementById('memberSince');
    if (memberSince) memberSince.textContent = formatDate(user.created_at);

    // Load trip stats
    const trips = await api.get('/trips');
    const totalTrips = trips.length;
    document.getElementById('statMyTrips').textContent = totalTrips;

    // Traveler level
    const levelBadge = document.getElementById('travelerLevelBadge');
    const levelDesc = document.getElementById('travelerLevelDesc');
    if (levelBadge && levelDesc) {
      if (totalTrips === 0) { levelBadge.textContent = "Novice"; levelDesc.textContent = "Plan your first trip!"; }
      else if (totalTrips < 3) { levelBadge.textContent = "Explorer"; levelDesc.textContent = "You're getting the hang of it!"; }
      else if (totalTrips < 10) { levelBadge.textContent = "Globetrotter"; levelDesc.textContent = "A seasoned traveler!"; }
      else { levelBadge.textContent = "World Nomad"; levelDesc.textContent = "You practically live out of a suitcase!"; }
    }

    // Places Visited (from destinations)
    const placesGrid = document.getElementById('placesVisitedGrid');
    if (placesGrid) {
      placesGrid.innerHTML = '';
      const uniqueDestinations = [...new Set(trips.map(t => t.destination).filter(Boolean))];
      document.getElementById('statMyCities').textContent = uniqueDestinations.length;
      
      if (uniqueDestinations.length === 0) {
        placesGrid.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem">No places visited yet.</p>';
      } else {
        uniqueDestinations.forEach(dest => {
          const badge = document.createElement('span');
          badge.className = 'badge badge-cyan';
          badge.style.fontSize = '0.9rem';
          badge.style.padding = '8px 16px';
          badge.textContent = dest;
          placesGrid.appendChild(badge);
        });
      }
    }
  } catch (err) {
    showAlert('profileAlert', 'Failed to load profile: ' + err.message);
  }
}
