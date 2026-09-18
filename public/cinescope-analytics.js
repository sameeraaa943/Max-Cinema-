/**
 * CineScope Custom Analytics Tracker
 * Embed on https://cinescopecodespactor.netlify.app to collect real audience metrics
 */
(function (window, document) {
  'use strict';

  // Config: Set your Render backend API URL here or via window.CINESCOPE_API
  var API_BASE = window.CINESCOPE_API || 'https://cinescope-api.onrender.com';
  var ENDPOINT = API_BASE + '/api/public/analytics/event';

  // Session ID stored in sessionStorage (persists across page reloads in the same tab)
  var SESSION_KEY = 'cinescope_session_id';
  function getSessionId() {
    try {
      var sid = sessionStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = 'cs_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
        sessionStorage.setItem(SESSION_KEY, sid);
      }
      return sid;
    } catch (e) {
      return 'anonymous';
    }
  }

  // Core event sender
  function sendEvent(payload) {
    payload.sessionId = getSessionId();
    payload.url = window.location.href;
    payload.path = window.location.pathname;
    payload.referrer = document.referrer || null;
    payload.screen = window.innerWidth + 'x' + window.innerHeight;

    var body = JSON.stringify(payload);

    // Use sendBeacon if available, fallback to fetch
    if (navigator.sendBeacon) {
      var blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(ENDPOINT, blob);
    } else {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: body,
        keepalive: true,
      }).catch(function () {
        // Silently swallow analytics failure
      });
    }
  }

  // Public CineScope tracker API
  window.cinescope = {
    // Generic event
    track: function (eventName, metadata) {
      sendEvent({ event: eventName, metadata: metadata });
    },

    // Movie view
    trackMovieView: function (movieId, title) {
      sendEvent({
        event: 'movie_view',
        contentId: movieId,
        contentType: 'movie',
        metadata: { title: title },
      });
    },

    // TV Show view
    trackTVView: function (tvShowId, title) {
      sendEvent({
        event: 'tv_show_view',
        contentId: tvShowId,
        contentType: 'tv_show',
        metadata: { title: title },
      });
    },

    // Search query
    trackSearch: function (query) {
      if (!query || !query.trim()) return;
      sendEvent({
        event: 'search',
        searchQuery: query.trim(),
      });
    },

    // Featured/Trending click
    trackClick: function (type, contentId) {
      sendEvent({
        event: type + '_click',
        contentId: contentId,
      });
    },
  };

  // Automatically record initial page view
  sendEvent({ event: 'page_view' });

  // Listen to single-page app history push if running inside a SPA
  var originalPushState = history.pushState;
  if (originalPushState) {
    history.pushState = function () {
      originalPushState.apply(this, arguments);
      setTimeout(function () {
        sendEvent({ event: 'page_view' });
      }, 50);
    };
  }
})(window, document);

