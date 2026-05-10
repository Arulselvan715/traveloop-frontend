// ============================================================
// js/itinerary.js — Full Trip Detail (All 5 Tabs)
// ============================================================

let tripId = null;
let currentTrip = null;
let stops = [];
let currentStopId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  const params = new URLSearchParams(window.location.search);
  tripId = params.get('id');
  if (!tripId) { window.location.href = 'myTrips.html'; return; }

  setupSidebar();
  setupLogout();
  populateUserInfo();
  setupModalClosers();
  setupTabs();
  await loadTrip();
  await loadStops();
  await loadChecklist();
  await loadNotes();
  await loadBudget();
  setupForms();
  document.getElementById('saveBudgetBtn')?.addEventListener('click', saveBudget);
});

// ── Trip Info ─────────────────────────────────────────────────
async function loadTrip() {
  try {
    currentTrip = await api.get(`/trips/${tripId}`);
    document.getElementById('tripTitle').textContent = currentTrip.name;
    document.getElementById('sidebarTripName').textContent = currentTrip.name;
    document.title = `Traveloop — ${currentTrip.name}`;

    const days = tripDays(currentTrip.start_date, currentTrip.end_date);
    document.getElementById('tripDates').textContent =
      currentTrip.start_date
        ? `${formatDate(currentTrip.start_date)} → ${formatDate(currentTrip.end_date)}${days ? ` · ${days} days` : ''}`
        : 'Dates not set';
    document.getElementById('tripDesc').textContent = currentTrip.description || '';

    // Share toggle
    const shareBtn = document.getElementById('shareBtn');
    const unshareBtn = document.getElementById('unshareBtn');
    const shareBanner = document.getElementById('shareBanner');
    if (currentTrip.is_public && currentTrip.share_token) {
      if (shareBtn) shareBtn.style.display = 'none';
      if (unshareBtn) unshareBtn.style.display = 'inline-flex';
      if (shareBanner) {
        shareBanner.style.display = 'flex';
        const shareUrl = `${window.location.origin}/sharedTrip.html?token=${currentTrip.share_token}`;
        document.getElementById('shareLink').textContent = shareUrl;
        document.getElementById('copyShareLink').onclick = () => {
          navigator.clipboard.writeText(shareUrl);
          showAlert('topAlert', 'Link copied!', 'success');
        };
      }
    }
  } catch (err) {
    console.error('Load trip error:', err);
  }
}

// ── Tabs ──────────────────────────────────────────────────────
function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`)?.classList.add('active');
    });
  });
}

// ── Stops ─────────────────────────────────────────────────────
async function loadStops() {
  try {
    stops = await api.get(`/trips/${tripId}/stops`);
    renderStops();
    populateStopSelect();
  } catch (err) { console.error(err); }
}

function renderStops() {
  const list = document.getElementById('stopsList');
  const empty = document.getElementById('stopsEmpty');
  if (!stops.length) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  list.innerHTML = stops.map((stop, idx) => `
    <div class="list-item" draggable="true" data-id="${stop.id}">
      <span class="drag-handle" title="Drag to reorder">⠿</span>
      <div class="list-item-content">
        <div class="list-item-title">
          <span style="color:var(--accent-primary);margin-right:6px">${idx + 1}.</span>
          ${escapeHtml(stop.city)}${stop.country ? `, ${escapeHtml(stop.country)}` : ''}
        </div>
        <div class="list-item-sub">
          📅 ${formatDate(stop.arrival_date)} → ${formatDate(stop.departure_date)}
          ${stop.notes ? `· <em>${escapeHtml(stop.notes)}</em>` : ''}
          ${stop.activity_total > 0 ? `· 💵 ₹${parseFloat(stop.activity_total).toFixed(2)} in activities` : ''}
        </div>
      </div>
      <div class="list-item-actions">
        <button class="btn-icon" title="Edit" onclick="openEditStop(${stop.id})">✏️</button>
        <button class="btn-icon" title="Delete" onclick="deleteStop(${stop.id})">🗑️</button>
      </div>
    </div>
  `).join('');
  setupDragAndDrop();
}

function populateStopSelect() {
  const sel = document.getElementById('activityStopSelect');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">— Choose a city —</option>';
  stops.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.city;
    sel.appendChild(opt);
  });
  if (prev) sel.value = prev;
}

function openEditStop(id) {
  const stop = stops.find(s => s.id === id);
  if (!stop) return;
  document.getElementById('editStopId').value = stop.id;
  document.getElementById('editStopCity').value = stop.city;
  document.getElementById('editStopCountry').value = stop.country || '';
  document.getElementById('editStopArrival').value = toInputDate(stop.arrival_date);
  document.getElementById('editStopDeparture').value = toInputDate(stop.departure_date);
  document.getElementById('editStopNotes').value = stop.notes || '';
  openModal('editStopModal');
}

async function deleteStop(id) {
  const stop = stops.find(s => s.id === id);
  if (!confirm(`Delete stop "${stop?.city}"?`)) return;
  try {
    await api.delete(`/stops/${id}`);
    await loadStops();
  } catch (err) { alert('Failed to delete stop.'); }
}

function setupDragAndDrop() {
  const items = document.querySelectorAll('#stopsList .list-item');
  let draggedEl = null;
  items.forEach(item => {
    item.addEventListener('dragstart', () => {
      draggedEl = item;
      setTimeout(() => item.style.opacity = '0.4', 0);
    });
    item.addEventListener('dragend', () => { item.style.opacity = '1'; draggedEl = null; });
    item.addEventListener('dragover', e => {
      e.preventDefault();
      if (draggedEl && draggedEl !== item) {
        const list = item.parentNode;
        const itemsArr = [...list.querySelectorAll('.list-item')];
        const dragIdx = itemsArr.indexOf(draggedEl);
        const targetIdx = itemsArr.indexOf(item);
        if (dragIdx < targetIdx) list.insertBefore(draggedEl, item.nextSibling);
        else list.insertBefore(draggedEl, item);
      }
    });
    item.addEventListener('drop', async e => {
      e.preventDefault();
      const order = [...document.querySelectorAll('#stopsList .list-item')].map((el, idx) => ({
        id: parseInt(el.dataset.id), order_index: idx
      }));
      try { await api.put(`/trips/${tripId}/stops/reorder`, { order }); await loadStops(); }
      catch (err) { console.error(err); }
    });
  });
}

// ── Activities ────────────────────────────────────────────────
async function loadActivities() {
  const sel = document.getElementById('activityStopSelect');
  currentStopId = sel?.value;
  const list = document.getElementById('activitiesList');
  const empty = document.getElementById('activitiesEmpty');
  const addRow = document.getElementById('addActivityRow');

  if (!currentStopId) {
    if (list) list.innerHTML = '';
    if (empty) empty.style.display = 'none';
    if (addRow) addRow.style.display = 'none';
    return;
  }
  if (addRow) addRow.style.display = 'block';

  try {
    const activities = await api.get(`/stops/${currentStopId}/activities`);
    if (!activities.length) {
      if (list) list.innerHTML = '';
      if (empty) empty.style.display = 'block';
      return;
    }
    if (empty) empty.style.display = 'none';
    list.innerHTML = activities.map(act => `
      <div class="list-item">
        <div class="list-item-content">
          <div class="list-item-title" style="display:flex;align-items:center;gap:8px">
            ${escapeHtml(act.name)} ${act.category ? categoryBadge(act.category) : ''}
          </div>
          <div class="list-item-sub">
            ${act.cost ? `💵 ₹${parseFloat(act.cost).toFixed(2)}` : ''}
            ${act.duration_hours ? `· ⏱ ${act.duration_hours}h` : ''}
            ${act.description ? `· ${escapeHtml(act.description)}` : ''}
          </div>
        </div>
        <button class="btn-icon" onclick="deleteActivity(${act.id})">🗑️</button>
      </div>
    `).join('');
  } catch (err) { console.error(err); }
}

async function deleteActivity(id) {
  if (!confirm('Delete this activity?')) return;
  try { await api.delete(`/activities/${id}`); await loadActivities(); await loadBudget(); }
  catch (err) { alert('Failed to delete.'); }
}

// ── Budget ────────────────────────────────────────────────────
async function loadBudget() {
  try {
    const b = await api.get(`/trips/${tripId}/budget`);
    document.getElementById('budgetTransport').value = b.transport_cost || 0;
    document.getElementById('budgetStay').value = b.stay_cost || 0;
    document.getElementById('budgetFood').value = b.food_cost || 0;
    document.getElementById('budgetOther').value = b.other_cost || 0;
    document.getElementById('budgetActivityCost').textContent = `₹${parseFloat(b.activity_cost || 0).toFixed(2)}`;
    recalcBudget(b);
  } catch (err) { console.error(err); }
}

function recalcBudget(b) {
  const t = parseFloat(b?.transport_cost || document.getElementById('budgetTransport')?.value || 0);
  const s = parseFloat(b?.stay_cost || document.getElementById('budgetStay')?.value || 0);
  const f = parseFloat(b?.food_cost || document.getElementById('budgetFood')?.value || 0);
  const o = parseFloat(b?.other_cost || document.getElementById('budgetOther')?.value || 0);
  const actText = document.getElementById('budgetActivityCost')?.textContent || '₹0';
  const a = parseFloat(actText.replace('₹', '')) || 0;
  const total = t + s + f + o + a;
  document.getElementById('budgetTotal').textContent = `₹${total.toFixed(2)}`;
  const days = tripDays(currentTrip?.start_date, currentTrip?.end_date);
  document.getElementById('budgetDaily').textContent = days ? `₹${(total / days).toFixed(2)}` : '—';

  // Update progress bars
  ['transport', 'stay', 'food', 'other', 'activity'].forEach(key => {
    const val = key === 'activity' ? a : parseFloat({ transport: t, stay: s, food: f, other: o }[key] || 0);
    const bar = document.getElementById(`bar-${key}`);
    if (bar && total > 0) bar.style.width = `${Math.min((val / total) * 100, 100)}%`;
  });
}

async function saveBudget() {
  const btn = document.getElementById('saveBudgetBtn');
  setButtonLoading(btn, true);
  try {
    await api.put(`/trips/${tripId}/budget`, {
      transport_cost: parseFloat(document.getElementById('budgetTransport').value) || 0,
      stay_cost: parseFloat(document.getElementById('budgetStay').value) || 0,
      food_cost: parseFloat(document.getElementById('budgetFood').value) || 0,
      other_cost: parseFloat(document.getElementById('budgetOther').value) || 0,
    });
    await loadBudget();
    showAlert('topAlert', 'Budget saved!', 'success');
  } catch (err) { alert('Failed to save budget.'); }
  finally { setButtonLoading(btn, false); }
}

['budgetTransport', 'budgetStay', 'budgetFood', 'budgetOther'].forEach(id => {
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById(id)?.addEventListener('input', () => recalcBudget({}));
  });
});

// ── Checklist ─────────────────────────────────────────────────
async function loadChecklist() {
  try {
    const items = await api.get(`/trips/${tripId}/checklist`);
    renderChecklist(items);
  } catch (err) { console.error(err); }
}

function renderChecklist(items) {
  const cont = document.getElementById('checklistItems');
  const empty = document.getElementById('checklistEmpty');
  const progress = document.getElementById('packingProgress');
  if (!items.length) {
    cont.innerHTML = '';
    if (empty) empty.style.display = 'block';
    if (progress) progress.textContent = '0 / 0 packed';
    return;
  }
  if (empty) empty.style.display = 'none';
  const packed = items.filter(i => i.is_packed).length;
  if (progress) progress.textContent = `${packed} / ${items.length} packed`;

  const pct = items.length ? (packed / items.length) * 100 : 0;
  const pBar = document.getElementById('packingBar');
  if (pBar) pBar.style.width = pct + '%';

  cont.innerHTML = items.map(item => `
    <div class="checklist-item ${item.is_packed ? 'packed' : ''}">
      <div class="check-box ${item.is_packed ? 'checked' : ''}" onclick="toggleItem(${item.id})"></div>
      <span class="check-label" onclick="toggleItem(${item.id})">${escapeHtml(item.item_name)}</span>
      <button class="btn-icon" onclick="deleteChecklistItem(${item.id})">🗑️</button>
    </div>
  `).join('');
}

async function toggleItem(id) {
  try { await api.patch(`/checklist/${id}/toggle`); await loadChecklist(); }
  catch (err) { console.error(err); }
}

async function deleteChecklistItem(id) {
  try { await api.delete(`/checklist/${id}`); await loadChecklist(); }
  catch (err) { alert('Failed to delete.'); }
}

// ── Notes ─────────────────────────────────────────────────────
async function loadNotes() {
  try {
    const notes = await api.get(`/trips/${tripId}/notes`);
    renderNotes(notes);
  } catch (err) { console.error(err); }
}

function renderNotes(notes) {
  const list = document.getElementById('notesList');
  const empty = document.getElementById('notesEmpty');
  if (!notes.length) {
    list.innerHTML = '';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  list.innerHTML = notes.map(note => `
    <div class="note-card">
      <div class="note-card-header">
        <div class="note-card-title">${note.title ? escapeHtml(note.title) : '<em style="color:var(--text-muted)">Untitled</em>'}</div>
        <div style="display:flex;gap:4px">
          <button class="btn-icon" onclick="openEditNote(${note.id}, '${escapeHtml(note.title || '')}', ${JSON.stringify(escapeHtml(note.content))})">✏️</button>
          <button class="btn-icon" onclick="deleteNote(${note.id})">🗑️</button>
        </div>
      </div>
      <div class="note-card-body">${escapeHtml(note.content)}</div>
      <div class="note-card-footer">Updated ${formatDate(note.updated_at)}</div>
    </div>
  `).join('');
}

function openEditNote(id, title, content) {
  document.getElementById('editNoteId').value = id;
  document.getElementById('editNoteTitle').value = title || '';
  document.getElementById('editNoteContent').value = content || '';
  openModal('editNoteModal');
}

async function deleteNote(id) {
  if (!confirm('Delete this note?')) return;
  try { await api.delete(`/notes/${id}`); await loadNotes(); }
  catch (err) { alert('Failed to delete note.'); }
}

// ── Share ─────────────────────────────────────────────────────
document.getElementById('shareBtn')?.addEventListener('click', async () => {
  try {
    const data = await api.post(`/trips/${tripId}/share`);
    await loadTrip();
    showAlert('topAlert', 'Trip is now public!', 'success');
  } catch (err) { alert(err.message); }
});

document.getElementById('unshareBtn')?.addEventListener('click', async () => {
  if (!confirm('Make this trip private?')) return;
  try {
    await api.delete(`/trips/${tripId}/share`);
    location.reload();
  } catch (err) { alert(err.message); }
});

// ── Form Handlers ─────────────────────────────────────────────
function setupForms() {
  // Add Stop
  document.getElementById('addStopForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api.post(`/trips/${tripId}/stops`, {
        city: document.getElementById('stopCity').value.trim(),
        country: document.getElementById('stopCountry').value.trim() || null,
        arrival_date: document.getElementById('stopArrival').value || null,
        departure_date: document.getElementById('stopDeparture').value || null,
        notes: document.getElementById('stopNotes').value.trim() || null,
      });
      closeModal('addStopModal');
      e.target.reset();
      await loadStops();
    } catch (err) { alert(err.message); }
  });

  // Edit Stop
  document.getElementById('editStopForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('editStopId').value;
    try {
      await api.put(`/stops/${id}`, {
        city: document.getElementById('editStopCity').value.trim(),
        country: document.getElementById('editStopCountry').value.trim() || null,
        arrival_date: document.getElementById('editStopArrival').value || null,
        departure_date: document.getElementById('editStopDeparture').value || null,
        notes: document.getElementById('editStopNotes').value.trim() || null,
      });
      closeModal('editStopModal');
      await loadStops();
    } catch (err) { alert(err.message); }
  });

  // Add Activity
  document.getElementById('addActivityForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!currentStopId) { alert('Please select a city first.'); return; }
    try {
      await api.post(`/stops/${currentStopId}/activities`, {
        name: document.getElementById('activityName').value.trim(),
        category: document.getElementById('activityCategory').value || null,
        cost: parseFloat(document.getElementById('activityCost').value) || 0,
        duration_hours: parseFloat(document.getElementById('activityDuration').value) || 1,
        description: document.getElementById('activityDesc').value.trim() || null,
      });
      closeModal('addActivityModal');
      e.target.reset();
      await loadActivities();
      await loadBudget();
    } catch (err) { alert(err.message); }
  });

  // Add Checklist Item
  document.getElementById('addItemForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api.post(`/trips/${tripId}/checklist`, {
        item_name: document.getElementById('itemName').value.trim(),
      });
      closeModal('addItemModal');
      e.target.reset();
      await loadChecklist();
    } catch (err) { alert(err.message); }
  });

  // Add Note
  document.getElementById('addNoteForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    try {
      await api.post(`/trips/${tripId}/notes`, {
        title: document.getElementById('noteTitle').value.trim() || null,
        content: document.getElementById('noteContent').value.trim(),
      });
      closeModal('addNoteModal');
      e.target.reset();
      await loadNotes();
    } catch (err) { alert(err.message); }
  });

  // Edit Note
  document.getElementById('editNoteForm')?.addEventListener('submit', async e => {
    e.preventDefault();
    const id = document.getElementById('editNoteId').value;
    try {
      await api.put(`/notes/${id}`, {
        title: document.getElementById('editNoteTitle').value.trim() || null,
        content: document.getElementById('editNoteContent').value.trim(),
      });
      closeModal('editNoteModal');
      await loadNotes();
    } catch (err) { alert(err.message); }
  });
}
