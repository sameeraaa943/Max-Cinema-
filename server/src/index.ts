import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

import { authRouter } from './routes/auth';
import { moviesRouter } from './routes/movies';
import { tvShowsRouter } from './routes/tvShows';
import { featuredRouter } from './routes/featured';
import { trendingRouter } from './routes/trending';
import { collectionsRouter } from './routes/collections';
import { homepageRouter } from './routes/homepage';
import { analyticsRouter } from './routes/analytics';
import { adsRouter } from './routes/ads';
import { settingsRouter } from './routes/settings';
import { auditRouter } from './routes/audit';
import { publicRouter } from './routes/public';
import { tmdbRouter } from './routes/tmdb';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// In development allow localhost
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000');
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (curl, mobile apps in dev)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ── Security ──────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // API — no HTML pages served
  })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── Middleware ────────────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// ── Public Routes (no auth) ───────────────────────────────────────────────
const ANALYTICS_SCRIPT = `/**
 * CineScope Custom Analytics Tracker
 * Embedded on public movie website: https://cinescopecodespactor.netlify.app
 */
(function(window,document){'use strict';var API_BASE=window.CINESCOPE_API||'https://cinescope-api-9ukz.onrender.com';var ENDPOINT=API_BASE+'/api/public/analytics/event';var SESSION_KEY='cinescope_session_id';function getSessionId(){try{var sid=sessionStorage.getItem(SESSION_KEY);if(!sid){sid='cs_'+Math.random().toString(36).substring(2,11)+'_'+Date.now().toString(36);sessionStorage.setItem(SESSION_KEY,sid);}return sid;}catch(e){return'anonymous';}}function sendEvent(payload){payload.sessionId=getSessionId();payload.url=window.location.href;payload.path=window.location.pathname;payload.referrer=document.referrer||null;payload.screen=window.innerWidth+'x'+window.innerHeight;var body=JSON.stringify(payload);if(navigator.sendBeacon){var blob=new Blob([body],{type:'application/json'});navigator.sendBeacon(ENDPOINT,blob);}else{fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:body,keepalive:true}).catch(function(){});}}window.cinescope={track:function(eventName,metadata){sendEvent({event:eventName,metadata:metadata});},trackMovieView:function(movieId,title){sendEvent({event:'movie_view',contentId:movieId,contentType:'movie',metadata:{title:title}});},trackTVView:function(tvShowId,title){sendEvent({event:'tv_show_view',contentId:tvShowId,contentType:'tv_show',metadata:{title:title}});},trackSearch:function(query){if(!query||!query.trim())return;sendEvent({event:'search',searchQuery:query.trim()});},trackClick:function(type,contentId){sendEvent({event:type+'_click',contentId:contentId});}};sendEvent({event:'page_view'});var originalPushState=history.pushState;if(originalPushState){history.pushState=function(){originalPushState.apply(this,arguments);setTimeout(function(){sendEvent({event:'page_view'});},50);};}})(window,document);`;

app.get('/cinescope-analytics.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(ANALYTICS_SCRIPT);
});

app.use('/api/public', publicRouter);

// ── Auth Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Admin Routes (auth required) ─────────────────────────────────────────
app.use('/api/admin/movies', moviesRouter);
app.use('/api/admin/tv-shows', tvShowsRouter);
app.use('/api/admin/featured', featuredRouter);
app.use('/api/admin/trending', trendingRouter);
app.use('/api/admin/collections', collectionsRouter);
app.use('/api/admin/homepage', homepageRouter);
app.use('/api/admin/analytics', analyticsRouter);
app.use('/api/admin/ads', adsRouter);
app.use('/api/admin/settings', settingsRouter);
app.use('/api/admin/audit', auditRouter);
app.use('/api/admin/tmdb', tmdbRouter);

// ── 404 ───────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Error Handler ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎬 CineScope API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;

