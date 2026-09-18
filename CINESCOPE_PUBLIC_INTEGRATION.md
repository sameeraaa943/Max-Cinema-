# CineScope Public Website Integration Guide

This guide details how to connect the existing public CineScope website:
**[https://cinescopecodespactor.netlify.app/](https://cinescopecodespactor.netlify.app/)**
to the new CineScope Admin Backend API.

---

## 1. System Architecture

```text
┌──────────────────────────────────────────────┐
│  Public CineScope Website                    │
│  (https://cinescopecodespactor.netlify.app)  │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTPS GET / POST (Public Endpoints)
                       ▼
┌──────────────────────────────────────────────┐
│  CineScope Backend API                       │
│  (Hosted on Render.com)                      │
│  e.g. https://cinescope-api.onrender.com     │
└──────────────────────┬───────────────────────┘
                       │
                       │ SSL Connection Pool (Port 6543)
                       ▼
┌──────────────────────────────────────────────┐
│  Supabase PostgreSQL Database                │
│  - Movies, TV Shows, Genres, Featured        │
│  - Trending, Collections, Ads, Analytics     │
└──────────────────────────────────────────────┘
```

---

## 2. Public API Endpoints (No Auth Required)

Base URL: `https://your-cinescope-api.onrender.com` (or `http://localhost:3001` in local dev)

| Endpoint | Method | Description |
| :--- | :---: | :--- |
| `/api/public/homepage` | `GET` | Returns hero banner + all enabled sections and items |
| `/api/public/featured` | `GET` | Returns ordered list of active featured movies & series |
| `/api/public/trending` | `GET` | Returns ranked list of trending movies & series |
| `/api/public/movies` | `GET` | Paginated movies list (supports `?search=`, `?genre=`, `?page=`, `?limit=`) |
| `/api/public/movies/:id` | `GET` | Full movie details with cast, trailer, and genres |
| `/api/public/tv-shows` | `GET` | Paginated series list |
| `/api/public/tv-shows/:id` | `GET` | Full TV series details |
| `/api/public/collections` | `GET` | Active public collections with item counts |
| `/api/public/collections/:slug` | `GET` | Collection details with all titles inside |
| `/api/public/genres` | `GET` | All available genres |
| `/api/public/ads` | `GET` | Active advertisements (supports `?placement=HOMEPAGE`, `?device=mobile`) |
| `/api/public/analytics/event` | `POST` | Custom analytics event ingestion |

---

## 3. Quick Setup: Analytics & Tracking Script

Add this single `<script>` tag inside your public site's `<head>` or before `</body>`:

```html
<!-- CineScope Telemetry Tracker -->
<script>
  window.CINESCOPE_API = "https://your-cinescope-api.onrender.com";
</script>
<script src="https://your-cinescope-api.onrender.com/public/cinescope-analytics.js" async></script>
```

### Manual Tracking Methods

Once the script is loaded, you can track user actions anywhere in your frontend:

```javascript
// Track when a user opens a movie page
window.cinescope.trackMovieView("movie_id_here", "Oppenheimer");

// Track when a user searches
window.cinescope.trackSearch("Batman");

// Track when a user plays a trailer
window.cinescope.track("trailer_click", { movieId: "123", title: "Dune" });
```

---

## 4. Frontend Integration Snippets

### A. Fetching Dynamic Homepage Content

```javascript
async function loadCineScopeHome() {
  const res = await fetch("https://your-cinescope-api.onrender.com/api/public/homepage");
  const { data } = await res.json();

  // 1. Hero Spotlight
  if (data.heroEnabled) {
    document.getElementById("hero-title").textContent = data.heroTitle;
    document.getElementById("hero-desc").textContent = data.heroDescription;
    document.getElementById("hero-cta").textContent = data.ctaText;
  }

  // 2. Sections
  data.sections.forEach(section => {
    console.log("Section:", section.title, "Type:", section.type, "Limit:", section.itemLimit);
  });
}
```

### B. Fetching Featured Titles for the Marquee

```javascript
async function loadFeaturedMovies() {
  const res = await fetch("https://your-cinescope-api.onrender.com/api/public/featured");
  const { data } = await res.json();

  const container = document.getElementById("featured-grid");
  container.innerHTML = data.map(item => {
    const title = item.movie ? item.movie.title : item.tvShow.title;
    const poster = item.movie ? item.movie.posterUrl : item.tvShow.posterUrl;
    const rating = item.movie ? item.movie.rating : item.tvShow.rating;

    return `
      <div class="movie-card">
        <img src="${poster}" alt="${title}" />
        <h3>${title}</h3>
        <span>★ ${rating || 'N/A'}</span>
      </div>
    `;
  }).join("");
}
```

### C. Fetching Advertisements

To render active ads (e.g. Header Leaderboard or In-feed banners):

```javascript
async function loadHomepageAds() {
  const res = await fetch("https://your-cinescope-api.onrender.com/api/public/ads?placement=HOMEPAGE");
  const { data } = await res.json();

  if (data && data.length > 0) {
    const adContainer = document.getElementById("ad-slot-homepage");
    // Insert the configured ad code (Google AdSense snippet or banner HTML)
    adContainer.innerHTML = data[0].adCode;
  }
}
```

---

## 5. Google AdSense Publisher Account

The existing CineScope website is configured with Google AdSense Publisher:
`ca-pub-1450329989131749`

In the **CineScope Admin Dashboard** under the **Ads** tab:
1. Click **New Ad Unit**
2. Choose placement (e.g. `HOMEPAGE` or `HEADER`)
3. Paste the AdSense responsive display ad unit code
4. Click **Create Ad Unit**

The public site will immediately start serving that unit dynamically without requiring a rebuild!

