import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding CineScope database...');

  // Create default genres
  const genres = [
    { name: 'Action', slug: 'action', tmdbId: 28 },
    { name: 'Adventure', slug: 'adventure', tmdbId: 12 },
    { name: 'Animation', slug: 'animation', tmdbId: 16 },
    { name: 'Comedy', slug: 'comedy', tmdbId: 35 },
    { name: 'Crime', slug: 'crime', tmdbId: 80 },
    { name: 'Documentary', slug: 'documentary', tmdbId: 99 },
    { name: 'Drama', slug: 'drama', tmdbId: 18 },
    { name: 'Fantasy', slug: 'fantasy', tmdbId: 14 },
    { name: 'Horror', slug: 'horror', tmdbId: 27 },
    { name: 'Music', slug: 'music', tmdbId: 10402 },
    { name: 'Mystery', slug: 'mystery', tmdbId: 9648 },
    { name: 'Romance', slug: 'romance', tmdbId: 10749 },
    { name: 'Science Fiction', slug: 'sci-fi', tmdbId: 878 },
    { name: 'Thriller', slug: 'thriller', tmdbId: 53 },
    { name: 'War', slug: 'war', tmdbId: 10752 },
    { name: 'Western', slug: 'western', tmdbId: 37 },
    { name: 'Family', slug: 'family', tmdbId: 10751 },
    { name: 'History', slug: 'history', tmdbId: 36 },
  ];

  for (const genre of genres) {
    await prisma.genre.upsert({
      where: { slug: genre.slug },
      create: genre,
      update: { name: genre.name, tmdbId: genre.tmdbId },
    });
  }
  console.log(`✅ Created ${genres.length} genres`);

  // Create Super Admin
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@cinescope.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'CineScope2026!';
  const adminName = process.env.SEED_ADMIN_NAME || 'Super Admin';

  const existing = await prisma.adminUser.findFirst({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.adminUser.create({
      data: { email: adminEmail, name: adminName, passwordHash, role: 'SUPER_ADMIN' },
    });
    console.log(`✅ Created super admin: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  Change this password immediately after first login!`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  // Create default homepage config
  const existingConfig = await prisma.homepageConfig.findFirst();
  if (!existingConfig) {
    await prisma.homepageConfig.create({
      data: {
        heroEnabled: true,
        heroTitle: 'Welcome to CineScope',
        heroDescription: 'Discover the best movies and TV shows',
        ctaText: 'Browse Now',
        sections: {
          create: [
            { type: 'FEATURED', title: 'Featured', enabled: true, displayOrder: 0, itemLimit: 10 },
            { type: 'TRENDING', title: 'Trending Now', enabled: true, displayOrder: 1, itemLimit: 10 },
            { type: 'POPULAR_MOVIES', title: 'Popular Movies', enabled: true, displayOrder: 2, itemLimit: 12 },
            { type: 'POPULAR_TV', title: 'Popular TV Shows', enabled: true, displayOrder: 3, itemLimit: 12 },
            { type: 'NEW_RELEASES', title: 'New Releases', enabled: true, displayOrder: 4, itemLimit: 8 },
            { type: 'COLLECTIONS', title: 'Collections', enabled: true, displayOrder: 5, itemLimit: 6 },
          ],
        },
      },
    });
    console.log('✅ Created default homepage configuration');
  }

  // Default site settings
  const defaultSettings = [
    { key: 'general.siteName', value: 'CineScope', category: 'general' },
    { key: 'general.siteDescription', value: 'Discover movies and TV shows', category: 'general' },
    { key: 'appearance.accentColor', value: '#D4AF37', category: 'appearance' },
    { key: 'seo.siteTitle', value: 'CineScope — Discover Movies & TV Shows', category: 'seo' },
    { key: 'seo.robotsContent', value: 'index, follow', category: 'seo' },
    { key: 'homepage.itemsPerSection', value: 10, category: 'homepage' },
    { key: 'homepage.featuredLimit', value: 10, category: 'homepage' },
    { key: 'homepage.trendingLimit', value: 10, category: 'homepage' },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      create: setting as Parameters<typeof prisma.siteSetting.upsert>[0]['create'],
      update: {},
    });
  }
  console.log('✅ Created default site settings');

  console.log('\n🎬 CineScope database seeded successfully!');
  console.log('\nNext steps:');
  console.log('1. Set your .env file with real Supabase credentials');
  console.log('2. Run: npm run db:push (to apply schema to Supabase)');
  console.log('3. Run: npm run dev (to start the server)');
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

