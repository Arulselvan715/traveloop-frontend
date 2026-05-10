// ============================================================
// js/sharedTrip.js — Public Shared Trip View (No Auth)
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if (!token) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    return;
  }

  try {
    const data = await fetch(`${API_BASE}/trips/shared/${token}`).then(r => r.json());
    if (data.error) throw new Error(data.error);

    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('contentState').style.display = 'block';

    const { trip, stops } = data;
    document.title = `Traveloop — ${trip.name}`;
    document.getElementById('tripName').textContent = trip.name;
    document.getElementById('tripOwner').textContent = `by ${trip.owner_name}`;
    document.getElementById('tripDesc').textContent = trip.description || '';

    const days = tripDays(trip.start_date, trip.end_date);
    document.getElementById('tripDates').textContent =
      trip.start_date ? `${formatDate(trip.start_date)} → ${formatDate(trip.end_date)}${days ? ` · ${days} days` : ''}` : '';
    document.getElementById('stopCount').textContent = `${stops.length} destination${stops.length !== 1 ? 's' : ''}`;

    if (trip.cover_image) {
      const heroEl = document.getElementById('tripHero');
      if (heroEl) heroEl.style.backgroundImage = `url(${escapeHtml(trip.cover_image)})`;
    }

    // Render itinerary stops
    const container = document.getElementById('stopsContainer');
    if (!stops.length) {
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px">No itinerary yet.</p>';
    } else {
      container.innerHTML = stops.map((stop, idx) => `
        <div class="glass-card" style="padding:24px;margin-bottom:16px;">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
            <div style="width:36px;height:36px;background:var(--gradient-primary);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9rem;flex-shrink:0">${idx + 1}</div>
            <div>
              <div style="font-size:1.1rem;font-weight:700">${escapeHtml(stop.city)}${stop.country ? `, ${escapeHtml(stop.country)}` : ''}</div>
              <div style="font-size:0.8rem;color:var(--text-muted)">
                ${stop.arrival_date ? `📅 ${formatDate(stop.arrival_date)} → ${formatDate(stop.departure_date)}` : 'Dates TBD'}
              </div>
            </div>
          </div>
          ${stop.notes ? `<p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;padding:10px;background:rgba(255,255,255,0.03);border-radius:8px">${escapeHtml(stop.notes)}</p>` : ''}
          ${stop.activities?.length ? `
            <div style="margin-top:12px">
              <div style="font-size:0.78rem;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:8px;font-weight:600">Activities</div>
              ${stop.activities.map(act => `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(255,255,255,0.03);border-radius:8px;margin-bottom:6px;font-size:0.85rem">
                  <span>${escapeHtml(act.name)}</span>
                  ${act.category ? categoryBadge(act.category) : ''}
                  ${act.cost ? `<span style="margin-left:auto;color:var(--accent-green)">$${parseFloat(act.cost).toFixed(2)}</span>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('');
    }
  } catch (err) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    const errMsg = document.getElementById('errorMessage');
    if (errMsg) errMsg.textContent = err.message;
  }
});
