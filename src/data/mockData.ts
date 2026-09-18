// Mock data for CineScope Admin Dashboard

export const chartData = {
  sevenDays: [
    { day: 'Mon', visitors: 3200, movieViews: 2100, searches: 890 },
    { day: 'Tue', visitors: 2800, movieViews: 1900, searches: 750 },
    { day: 'Wed', visitors: 4100, movieViews: 2800, searches: 1100 },
    { day: 'Thu', visitors: 3700, movieViews: 2400, searches: 960 },
    { day: 'Fri', visitors: 5200, movieViews: 3600, searches: 1350 },
    { day: 'Sat', visitors: 6800, movieViews: 4900, searches: 1800 },
    { day: 'Sun', visitors: 7200, movieViews: 5300, searches: 2100 },
  ],
  thirtyDays: [
    { day: 'Week 1', visitors: 18200, movieViews: 12800, searches: 5200 },
    { day: 'Week 2', visitors: 22400, movieViews: 15600, searches: 6800 },
    { day: 'Week 3', visitors: 19800, movieViews: 13900, searches: 5900 },
    { day: 'Week 4', visitors: 26100, movieViews: 18400, searches: 7800 },
  ],
  ninetyDays: [
    { day: 'Jul', visitors: 68000, movieViews: 47000, searches: 19000 },
    { day: 'Aug', visitors: 74000, movieViews: 52000, searches: 22000 },
    { day: 'Sep', visitors: 84291, movieViews: 59000, searches: 25000 },
  ],
};

export const topMovies = [
  {
    rank: '01',
    title: 'Interstellar',
    rating: 8.7,
    year: 2014,
    genre: 'Sci-Fi',
    color: '#1a3a4a',
  },
  {
    rank: '02',
    title: 'Inception',
    rating: 8.8,
    year: 2010,
    genre: 'Thriller',
    color: '#2a1a4a',
  },
  {
    rank: '03',
    title: 'The Dark Knight',
    rating: 9.0,
    year: 2008,
    genre: 'Action',
    color: '#1a1a3a',
  },
  {
    rank: '04',
    title: 'Dune',
    rating: 8.0,
    year: 2021,
    genre: 'Sci-Fi',
    color: '#3a2a1a',
  },
  {
    rank: '05',
    title: 'Avengers: Endgame',
    rating: 8.0,
    year: 2019,
    genre: 'Action',
    color: '#3a1a1a',
  },
];

export const recentActivity = [
  {
    id: 1,
    action: 'Movie "Dune: Part Two" updated',
    detail: 'Description and poster image updated',
    time: '10 minutes ago',
    type: 'update',
  },
  {
    id: 2,
    action: '"Interstellar" added to Featured',
    detail: 'Now showing on homepage featured section',
    time: '25 minutes ago',
    type: 'featured',
  },
  {
    id: 3,
    action: 'Homepage settings changed',
    detail: 'Hero banner updated to new release',
    time: '1 hour ago',
    type: 'settings',
  },
  {
    id: 4,
    action: 'New collection "Christopher Nolan" created',
    detail: '12 movies added to collection',
    time: '2 hours ago',
    type: 'collection',
  },
  {
    id: 5,
    action: '"Oppenheimer" added to Trending',
    detail: 'Trending rank #2 assigned',
    time: '3 hours ago',
    type: 'trending',
  },
];

export const systemStatus = [
  { label: 'Admin Dashboard', status: 'online', detail: 'All systems operational' },
  { label: 'Public Website', status: 'online', detail: 'Live at cinescopecodespactor.netlify.app' },
  { label: 'Database', status: 'demo', detail: 'Demo mode — no real data' },
  { label: 'TMDB', status: 'disconnected', detail: 'Not connected (UI only)' },
];

export const stats = [
  {
    id: 'movies',
    label: 'Movies',
    value: '12,482',
    change: '+8.2%',
    subtitle: 'This month',
    positive: true,
  },
  {
    id: 'tvshows',
    label: 'TV Shows',
    value: '2,841',
    change: '+5.4%',
    subtitle: 'This month',
    positive: true,
  },
  {
    id: 'views',
    label: 'Total Views',
    value: '84,291',
    change: '+12.8%',
    subtitle: 'This month',
    positive: true,
  },
  {
    id: 'featured',
    label: 'Featured',
    value: '42',
    change: 'Active',
    subtitle: 'Items active',
    positive: true,
  },
];

