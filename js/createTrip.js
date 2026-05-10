// ============================================================
// js/trip.js — Create/Edit Trip Page
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  setupSidebar();
  setupLogout();
  populateUserInfo();

  const params = new URLSearchParams(window.location.search);
  const tripId = params.get('id');
  const cityPrefill = params.get('city');

  if (tripId) {
    document.getElementById('pageTitle').textContent = 'Edit Trip';
    document.getElementById('formTitle').textContent = '✏️ Edit Trip Details';
    document.getElementById('submitBtn').textContent = 'Save Changes';
    await loadTripForEdit(tripId);
  } else {
    document.getElementById('pageTitle').textContent = 'Create Trip';
    document.getElementById('formTitle').textContent = '✈️ Plan a New Adventure';
    if (cityPrefill) {
      document.getElementById('tripName').value = `Trip to ${cityPrefill}`;
    }
  }

  document.getElementById('tripForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const body = {
      name: document.getElementById('tripName').value.trim(),
      description: document.getElementById('tripDesc').value.trim() || null,
      start_date: document.getElementById('startDate').value || null,
      end_date: document.getElementById('endDate').value || null,
      cover_image: document.getElementById('coverImage').value.trim() || null,
    };

    if (!body.name) { showAlert('alertBox', 'Trip name is required.'); return; }

    setButtonLoading(btn, true);
    try {
      let result;
      if (tripId) {
        result = await api.put(`/trips/${tripId}`, body);
      } else {
        result = await api.post('/trips', body);
      }
      window.location.href = `trip.html?id=${result.id}`;
    } catch (err) {
      showAlert('alertBox', err.message);
    } finally {
      setButtonLoading(btn, false);
    }
  });
});

async function loadTripForEdit(id) {
  try {
    const trip = await api.get(`/trips/${id}`);
    document.getElementById('tripName').value = trip.name || '';
    document.getElementById('tripDesc').value = trip.description || '';
    document.getElementById('startDate').value = toInputDate(trip.start_date);
    document.getElementById('endDate').value = toInputDate(trip.end_date);
    document.getElementById('coverImage').value = trip.cover_image || '';
    updatePreview(trip.cover_image);
  } catch (err) {
    showAlert('alertBox', 'Failed to load trip: ' + err.message);
  }
}

function updatePreview(url) {
  const preview = document.getElementById('coverPreview');
  if (!preview) return;
  if (url) {
    preview.innerHTML = `<img src="${escapeHtml(url)}" alt="Cover" onerror="this.parentNode.innerHTML='<span style=color:var(--text-muted)>Invalid image URL</span>'">`;
  } else {
    preview.innerHTML = '<span style="color:var(--text-muted);font-size:2rem">🌍</span>';
  }
}

document.getElementById('coverImage')?.addEventListener('input', function () {
  updatePreview(this.value.trim());
});
