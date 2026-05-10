// ============================================================
// js/dashboard.js — Dashboard Page Logic
// ============================================================

const DESTINATIONS = [
  { name: 'Paris', country: 'France', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=500&q=80' },
  { name: 'Tokyo', country: 'Japan', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=500&q=80' },
  { name: 'Bali', country: 'Indonesia', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=500&q=80' },
  { name: 'New York', country: 'USA', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=500&q=80' },
  { name: 'Rome', country: 'Italy', image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=500&q=80' },
  { name: 'Santorini', country: 'Greece', image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5f1?auto=format&fit=crop&w=500&q=80' },
];

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  setupSidebar();
  setupLogout();
  populateUserInfo();
  renderDestinations();

  await loadDashboardData();

  // Create trip button
  document.getElementById('createTripBtn')?.addEventListener('click', () => {
    window.location.href = 'createTrip.html';
  });
});

async function loadDashboardData() {
  try {
    const user = getUser();
    document.getElementById('heroName').textContent = user?.name?.split(' ')[0] || 'Traveler';

    const trips = await api.get('/trips');
    updateStats(trips);
    renderRecentTrips(trips.slice(0, 6));
  } catch (err) {
    console.error('Dashboard load error:', err);
  }
}

function updateStats(trips) {
  document.getElementById('statTotalTrips').textContent = trips.length;
  const upcoming = trips.filter(t => t.start_date && new Date(t.start_date) > new Date()).length;
  document.getElementById('statUpcoming').textContent = upcoming;
  const cities = trips.reduce((acc, t) => acc + parseInt(t.stop_count || 0), 0);
  document.getElementById('statCities').textContent = cities;
}

function renderRecentTrips(trips) {
  const container = document.getElementById('recentTrips');
  const emptyState = document.getElementById('tripsEmpty');

  if (!trips.length) {
    container.innerHTML = '';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }
  if (emptyState) emptyState.style.display = 'none';

  container.innerHTML = trips.map(trip => tripCard(trip)).join('');

  // Fetch stops for each trip asynchronously to display cities
  trips.forEach(async trip => {
    try {
      const stops = await api.get(`/trips/${trip.id}/stops`);
      const cities = stops.map(s => s.city).join(' ➔ ');
      const cardCitiesEl = document.getElementById(`trip-cities-${trip.id}`);
      if (cardCitiesEl) cardCitiesEl.textContent = cities || 'No cities added yet';
    } catch (e) {}
  });
}

function tripCard(trip) {
  const startStr = trip.start_date ? formatDate(trip.start_date) : null;
  const endStr = trip.end_date ? formatDate(trip.end_date) : null;
  const dateStr = startStr ? `${startStr}${endStr ? ' → ' + endStr : ''}` : 'No dates set';
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
        <div class="trip-card-desc" id="trip-cities-${trip.id}" style="color:var(--primary-light);font-weight:600;margin-bottom:8px;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Loading cities...</div>
        <div class="trip-card-meta">
          <span class="trip-card-date">📅 ${dateStr}${days ? ` · ${days}d` : ''}</span>
          <div class="trip-card-actions">
            <button class="btn-icon" title="Edit" onclick="event.stopPropagation(); editTrip(${trip.id})">✏️</button>
            <button class="btn-icon" title="Delete" onclick="event.stopPropagation(); deleteTrip(${trip.id}, '${escapeHtml(trip.name)}')">🗑️</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function editTrip(id) {
  window.location.href = `createTrip.html?id=${id}`;
}

async function deleteTrip(id, name) {
  if (!confirm(`Delete trip "${name}"? This cannot be undone.`)) return;
  try {
    await api.delete(`/trips/${id}`);
    await loadDashboardData();
  } catch (err) {
    alert('Failed to delete trip: ' + err.message);
  }
}

function renderDestinations() {
  const container = document.getElementById('destinationsGrid');
  if (!container) return;
  container.innerHTML = DESTINATIONS.map(d => `
    <div class="dest-card" onclick="quickCreateTrip('${d.name}')">
      <div class="dest-card-img" style="background: url('${d.image}') center/cover;"></div>
      <div class="dest-card-body">
        <div class="dest-card-name">${d.name}</div>
        <div class="dest-card-sub">${d.country}</div>
      </div>
    </div>
  `).join('');
}

function quickCreateTrip(cityName) {
  window.location.href = `createTrip.html?city=${encodeURIComponent(cityName)}`;
}
