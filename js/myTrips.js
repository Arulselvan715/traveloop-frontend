// ============================================================
// js/myTrips.js — My Trips Listing Page
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  setupSidebar();
  setupLogout();
  populateUserInfo();

  let allTrips = [];

  document.getElementById('createTripBtn')?.addEventListener('click', () => {
    window.location.href = 'createTrip.html';
  });

  document.getElementById('searchInput')?.addEventListener('input', function () {
    const q = this.value.toLowerCase();
    const filtered = q ? allTrips.filter(t => t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)) : allTrips;
    renderTrips(filtered);
  });

  document.getElementById('filterSelect')?.addEventListener('change', function () {
    applyFilter(allTrips, this.value);
  });

  try {
    allTrips = await api.get('/trips');
    renderTrips(allTrips);
  } catch (err) {
    document.getElementById('tripsGrid').innerHTML = '<p style="color:var(--accent-rose)">Failed to load trips.</p>';
  }
});

function applyFilter(trips, filter) {
  const now = new Date();
  let filtered = trips;
  if (filter === 'upcoming') filtered = trips.filter(t => t.start_date && new Date(t.start_date) > now);
  else if (filter === 'past') filtered = trips.filter(t => t.end_date && new Date(t.end_date) < now);
  else if (filter === 'public') filtered = trips.filter(t => t.is_public);
  renderTrips(filtered);
}

function renderTrips(trips) {
  const grid = document.getElementById('tripsGrid');
  const empty = document.getElementById('tripsEmpty');
  const count = document.getElementById('tripsCount');
  if (count) count.textContent = `${trips.length} trip${trips.length !== 1 ? 's' : ''}`;

  if (!trips.length) {
    grid.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  grid.innerHTML = trips.map(trip => {
    const days = tripDays(trip.start_date, trip.end_date);
    const coverUrl = trip.cover_image || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
    const coverHtml = `<img src="${escapeHtml(coverUrl)}" alt="${escapeHtml(trip.name)}">`;

    return `
      <div class="trip-card" onclick="window.location.href='trip.html?id=${trip.id}'">
        <div class="trip-card-cover">
          ${coverHtml}
          ${trip.is_public ? '<span class="trip-card-badge">🌐 Public</span>' : ''}
        </div>
        <div class="trip-card-body">
          <div class="trip-card-name">${escapeHtml(trip.name)}</div>
          <div style="color:var(--warning);font-size:0.8rem;margin-bottom:4px;letter-spacing:2px">★★★★★ <span style="color:var(--text-muted);font-size:0.75rem;letter-spacing:0">(5.0)</span></div>
          <div class="trip-card-desc" id="mytrips-cities-${trip.id}" style="color:var(--primary-light);font-weight:600;margin-bottom:8px;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Loading cities...</div>
          <div class="trip-card-meta">
            <span class="trip-card-date">
              📅 ${trip.start_date ? formatDate(trip.start_date) : 'TBD'}
              ${days ? ` · ${days} days` : ''}
            </span>
            <div class="trip-card-actions">
              <button class="btn-icon" title="Edit" onclick="event.stopPropagation(); window.location.href='createTrip.html?id=${trip.id}'">✏️</button>
              <button class="btn-icon" title="Delete" onclick="event.stopPropagation(); confirmDelete(${trip.id}, '${escapeHtml(trip.name)}')">🗑️</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Fetch stops for each trip asynchronously to display cities
  trips.forEach(async trip => {
    try {
      const stops = await api.get(`/trips/${trip.id}/stops`);
      const cities = stops.map(s => s.city).join(' ➔ ');
      const cardCitiesEl = document.getElementById(`mytrips-cities-${trip.id}`);
      if (cardCitiesEl) cardCitiesEl.textContent = cities || 'No cities added yet';
    } catch (e) {}
  });
}

async function confirmDelete(id, name) {
  if (!confirm(`Delete trip "${name}"? This is permanent.`)) return;
  try {
    await api.delete(`/trips/${id}`);
    location.reload();
  } catch (err) {
    alert('Delete failed: ' + err.message);
  }
}
