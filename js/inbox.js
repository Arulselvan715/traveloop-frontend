document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  setupSidebar();
  setupLogout();
  populateUserInfo();

  await loadNotifications();
});

async function loadNotifications() {
  const list = document.getElementById('notificationsList');
  if (!list) return;

  list.innerHTML = '<div style="text-align:center;padding:40px"><span class="spinner"></span> Checking for updates...</div>';

  try {
    const trips = await api.get('/trips');
    const now = new Date();
    const notifications = [];

    // 1. Logic for "Ask Review" after a trip is finished
    trips.forEach(trip => {
      if (trip.end_date) {
        const endDate = new Date(trip.end_date);
        if (endDate < now) {
          notifications.push({
            id: `review-${trip.id}`,
            icon: "✍️",
            title: `How was your trip to ${trip.name}?`,
            text: `Your trip has ended! Share your experiences and a review with the Traveloop community to help other travelers.`,
            time: "Action Required",
            action: () => window.location.href = `social.html`
          });
        }
      }
    });

    // 2. Add some mock welcome/social notifications
    notifications.push({
      id: "welcome",
      icon: "🎉",
      title: "Welcome to Traveloop!",
      text: "Thanks for joining our community of explorers. Start by planning your next adventure in the dashboard.",
      time: "Just now",
      action: () => window.location.href = 'dashboard.html'
    });

    if (notifications.length === 0) {
      list.innerHTML = `
        <div class="empty-inbox">
          <div style="font-size:3rem;margin-bottom:16px">📭</div>
          <h3>Your inbox is empty</h3>
          <p>We'll notify you when your trips end or when someone interacts with your posts.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = '';
    notifications.forEach(n => {
      const card = document.createElement('div');
      card.className = 'notification-card';
      card.innerHTML = `
        <div class="notification-icon">${n.icon}</div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-text">${n.text}</div>
          <div class="notification-time">${n.time}</div>
        </div>
      `;
      card.onclick = n.action;
      list.appendChild(card);
    });

  } catch (err) {
    console.error('Error loading notifications:', err);
    list.innerHTML = '<p style="color:var(--danger);text-align:center">Failed to load notifications. Please try again later.</p>';
  }
}
