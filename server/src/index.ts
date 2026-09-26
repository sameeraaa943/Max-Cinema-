import 'dotenv/config';
import express, { Request, Response } from 'express';
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
import { contentCenterRouter } from './routes/contentCenter';
import { mediaRouter } from './routes/media';
import { schedulerRouter } from './routes/scheduler';
import { systemHealthRouter } from './routes/systemHealth';

// V4 & V5 & V5.1 routes
import languagesRouter from './routes/languages';
import publicUsersRouter from './routes/publicUsers';
import reviewsRouter from './routes/reviews';
import monetizationRouter from './routes/monetization';
import pushNotificationsRouter from './routes/pushNotifications';
import seoRouter from './routes/seo';
import aiControlRouter from './routes/aiControl';
import networkPinsRouter from './routes/networkPins';
import aiRouter from './routes/ai';
import automationRouter from './routes/automation';
import alertsRouter from './routes/alerts';
import securityRouter from './routes/security';
import adminUsersRouter from './routes/adminUsers';
import backupsRouter from './routes/backups';
import integrationsRouter from './routes/integrations';
import recommendationsRouter from './routes/recommendations';

import { startSchedulerRunner } from './lib/schedulerRunner';
import { errorHandler } from './middleware/errorHandler';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Render Health Checks & Root Probes (Immediate 200 OK for Render / Uptime Probes) ──
app.all(['/healthz', '/health'], async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '5.1.0',
    });
  } catch {
    res.status(200).json({
      status: 'degraded',
      database: 'reconnecting',
      timestamp: new Date().toISOString(),
      version: '5.1.0',
    });
  }
});

app.head('/', (_req: Request, res: Response) => {
  res.status(200).end();
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    name: 'CineScope & Max Cinema Production API',
    version: '5.1.0',
    status: 'ONLINE',
    documentation: '/health',
    timestamp: new Date().toISOString(),
  });
});

// ── CORS ──────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://maxcinema-adminpanel.netlify.app',
  'https://cinescopecodespactor.netlify.app',
  ...(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
];

if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000');
}

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.netlify.app')) return callback(null, true);
    if (origin.startsWith('http://localhost:')) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ── Security ──────────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

// ── Rate Limiting ─────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 500,
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

// ── Analytics Script for Public Website ───────────────────────────────────
const ANALYTICS_SCRIPT = `/**
 * CineScope Custom Analytics Tracker
 * Embedded on public movie website: https://cinescopecodespactor.netlify.app
 */
(function(window,document){'use strict';var API_BASE=window.CINESCOPE_API||'https://cinescope-api-9ukz.onrender.com';var ENDPOINT=API_BASE+'/api/public/analytics/event';var SESSION_KEY='cinescope_session_id';function getSessionId(){try{var sid=sessionStorage.getItem(SESSION_KEY);if(!sid){sid='cs_'+Math.random().toString(36).substring(2,11)+'_'+Date.now().toString(36);sessionStorage.setItem(SESSION_KEY,sid);}return sid;}catch(e){return'anonymous';}}function sendEvent(payload){payload.sessionId=getSessionId();payload.url=window.location.href;payload.path=window.location.pathname;payload.referrer=document.referrer||null;payload.screen=window.innerWidth+'x'+window.innerHeight;var body=JSON.stringify(payload);if(navigator.sendBeacon){var blob=new Blob([body],{type:'application/json'});navigator.sendBeacon(ENDPOINT,blob);}else{fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:body,keepalive:true}).catch(function(){});}}window.cinescope={track:function(eventName,metadata){sendEvent({event:eventName,metadata:metadata});},trackMovieView:function(movieId,title){sendEvent({event:'movie_view',contentId:movieId,contentType:'movie',metadata:{title:title}});},trackTVView:function(tvShowId,title){sendEvent({event:'tv_show_view',contentId:tvShowId,contentType:'tv_show',metadata:{title:title}});},trackSearch:function(query){if(!query||!query.trim())return;sendEvent({event:'search',searchQuery:query.trim()});},trackClick:function(type,contentId){sendEvent({event:type+'_click',contentId:contentId});}};sendEvent({event:'page_view'});var originalPushState=history.pushState;if(originalPushState){history.pushState=function(){originalPushState.apply(this,arguments);setTimeout(function(){sendEvent({event:'page_view'});},50);};}})(window,document);`;

app.get('/cinescope-analytics.js', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(ANALYTICS_SCRIPT);
});

// ── Public Routes (no auth required) ──────────────────────────────────────
app.use('/api/public', publicRouter);
app.use('/api/public/recommendations', recommendationsRouter);

// ── Auth Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);

// ── Admin Routes (auth required) ──────────────────────────────────────────
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
app.use('/api/admin/content-center', contentCenterRouter);
app.use('/api/admin/media', mediaRouter);
app.use('/api/admin/scheduler', schedulerRouter);
app.use('/api/admin/system', systemHealthRouter);

// V4, V5, V5.1 Modules
app.use('/api/admin/languages', languagesRouter);
app.use('/api/admin/public-users', publicUsersRouter);
app.use('/api/admin/reviews', reviewsRouter);
app.use('/api/admin/monetization', monetizationRouter);
app.use('/api/admin/push-notifications', pushNotificationsRouter);
app.use('/api/admin/seo', seoRouter);
app.use('/api/admin/ai-control', aiControlRouter);
app.use('/api/admin/network-pins', networkPinsRouter);
app.use('/api/admin/ai', aiRouter);
app.use('/api/admin/automation', automationRouter);
app.use('/api/admin/alerts', alertsRouter);
app.use('/api/admin/security', securityRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin/backups', backupsRouter);
app.use('/api/admin/integrations', integrationsRouter);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Error Handler ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🎬 CineScope API running on port ${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`   Healthz: http://localhost:${PORT}/healthz`);

  // Start background content scheduler engine
  startSchedulerRunner(60000);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
