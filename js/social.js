document.addEventListener('DOMContentLoaded', () => {
  if (!requireAuth()) return;

  setupSidebar();
  setupLogout();
  populateUserInfo();

  loadSocialFeed('trending');

  document.getElementById('socialFilter')?.addEventListener('change', (e) => {
    loadSocialFeed(e.target.value);
  });
});

// Mock social feed data since the backend doesn't have a dedicated reviews table yet
const mockFeed = [
  {
    id: 1,
    author: "Elena Rodriguez",
    initial: "E",
    location: "Tokyo, Japan",
    rating: 5,
    content: "Absolutely mind-blowing trip! The mix of traditional temples in Kyoto and the neon lights of Tokyo was perfectly balanced. We used Traveloop to track our Shinkansen budgets and it saved us so much stress. Must visit: Shibuya Sky at sunset!",
    likes: 124,
    time: "2 hours ago"
  },
  {
    id: 2,
    author: "James Chen",
    initial: "J",
    location: "Santorini, Greece",
    rating: 4,
    content: "The views are just as incredible as you see in photos. However, be prepared for lots of stairs! Our daily step count was insane. Found an amazing hidden gem seafood restaurant in Oia.",
    likes: 88,
    time: "5 hours ago"
  },
  {
    id: 3,
    author: "Sarah Jenkins",
    initial: "S",
    location: "Banff National Park, Canada",
    rating: 5,
    content: "Just finished hiking around Lake Louise. The water really is that turquoise! Highly recommend going early in the morning to avoid the crowds. Next stop: Jasper.",
    likes: 215,
    time: "1 day ago"
  },
  {
    id: 4,
    author: "Marcus Thorne",
    initial: "M",
    location: "Rome, Italy",
    rating: 3,
    content: "Ate my weight in pasta and gelato. No regrets! The Colosseum tour was fantastic, but skip the line tickets are absolutely mandatory in the summer. It was way too crowded though.",
    likes: 45,
    time: "2 days ago"
  },
  {
    id: 5,
    author: "Aisha Patel",
    initial: "A",
    location: "Bali, Indonesia",
    rating: 5,
    content: "Spent a week in Ubud exploring the rice terraces and temples. The food is incredible and so affordable. Rented a scooter to get around which was terrifying but fun! 🛵🌴",
    likes: 310,
    time: "3 days ago"
  },
  {
    id: 6,
    author: "David Kim",
    initial: "D",
    location: "Reykjavik, Iceland",
    rating: 5,
    content: "Saw the Northern Lights! It's absolutely freezing but totally worth it. The Blue Lagoon was so relaxing after a long day of driving the Golden Circle.",
    likes: 412,
    time: "4 days ago"
  },
  {
    id: 7,
    author: "Sophia Martinez",
    initial: "S",
    location: "Paris, France",
    rating: 4,
    content: "The Louvre is huge, you definitely need a full day just for that. We had a picnic by the Eiffel Tower which was magical, but watch out for pickpockets on the metro!",
    likes: 189,
    time: "5 days ago"
  },
  {
    id: 8,
    author: "Omar Hassan",
    initial: "O",
    location: "Cape Town, South Africa",
    rating: 5,
    content: "Hiking Table Mountain was the highlight of my year. The views of the ocean are unbeatable. Also went down to Boulders Beach to see the penguins! 🐧",
    likes: 520,
    time: "1 week ago"
  },
  {
    id: 9,
    author: "Emma Wilson",
    initial: "E",
    location: "New York, USA",
    rating: 4,
    content: "Broadway was amazing! Central park in the fall is beautiful. The subway can be confusing at first but you get used to it. Ate the best slice of pizza in Brooklyn.",
    likes: 275,
    time: "1 week ago"
  },
  {
    id: 10,
    author: "Lucas Silva",
    initial: "L",
    location: "Rio de Janeiro, Brazil",
    rating: 5,
    content: "Christ the Redeemer at sunrise is an experience I will never forget. The energy at Copacabana beach is unmatched! Make sure to try authentic Pão de Queijo.",
    likes: 580,
    time: "2 weeks ago"
  },
  {
    id: 11,
    author: "Yuki Tanaka",
    initial: "Y",
    location: "London, UK",
    rating: 4,
    content: "Loved the museums, especially the British Museum and the Natural History Museum. The weather was classic London rain, but that just made the pubs feel cozier.",
    likes: 192,
    time: "2 weeks ago"
  },
  {
    id: 12,
    author: "Chloe Dubois",
    initial: "C",
    location: "Machu Picchu, Peru",
    rating: 5,
    content: "The Inca Trail was the hardest physical challenge of my life, but arriving at the Sun Gate to see Machu Picchu made every blister worth it. Breathtaking.",
    likes: 890,
    time: "3 weeks ago"
  },
  {
    id: 13,
    author: "Arjun Reddy",
    initial: "A",
    location: "Dubai, UAE",
    rating: 4,
    content: "Everything is so massive here! The view from the Burj Khalifa is dizzying. Desert safari and dune bashing was definitely the highlight of the trip for me.",
    likes: 340,
    time: "1 month ago"
  },
  {
    id: 14,
    author: "Mia Rossi",
    initial: "M",
    location: "Swiss Alps, Switzerland",
    rating: 5,
    content: "Taking the Glacier Express was like moving through a painting. The mountains, the lakes, the chocolate... Switzerland is pure perfection. Expensive, but worth every penny.",
    likes: 620,
    time: "1 month ago"
  }
];

function loadSocialFeed(filter) {
  const feedContainer = document.getElementById('socialFeed');
  if (!feedContainer) return;

  let sortedFeed = [...mockFeed];
  if (filter === 'top') sortedFeed.sort((a,b) => b.rating - a.rating);
  else if (filter === 'newest') sortedFeed.sort((a,b) => b.id - a.id); 
  else if (filter === 'trending') sortedFeed.sort((a,b) => b.likes - a.likes);

  feedContainer.innerHTML = '';

  sortedFeed.forEach(post => {
    const stars = '★'.repeat(post.rating) + '☆'.repeat(5 - post.rating);
    
    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
      <div class="post-header">
        <div class="post-avatar">${post.initial}</div>
        <div>
          <h3 class="post-author">${post.author}</h3>
          <div class="post-location">📍 ${post.location} • <span style="color:var(--text-muted);font-size:0.8rem;margin-left:4px">${post.time}</span></div>
        </div>
      </div>
      <div class="post-rating">${stars}</div>
      <p class="post-content">${escapeHtml(post.content)}</p>
      <div class="post-actions">
        <button class="action-btn" onclick="toggleLike(this, ${post.likes})">
          <span>🤍</span> <span class="like-count">${post.likes}</span> Likes
        </button>
        <button class="action-btn">
          <span>💬</span> Reply
        </button>
      </div>
    `;
    feedContainer.appendChild(card);
  });
}

function toggleLike(btn, baseLikes) {
  const isLiked = btn.classList.contains('liked');
  const countSpan = btn.querySelector('.like-count');
  const heartSpan = btn.querySelector('span:first-child');
  
  if (isLiked) {
    btn.classList.remove('liked');
    heartSpan.textContent = '🤍';
    countSpan.textContent = baseLikes;
  } else {
    btn.classList.add('liked');
    heartSpan.textContent = '❤️';
    countSpan.textContent = baseLikes + 1;
  }
}
