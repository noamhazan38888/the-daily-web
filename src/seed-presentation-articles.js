import { connectDatabase, disconnectDatabase } from './config/database.js';
import { User } from './models/User.js';
import { Article } from './models/Article.js';
import { ViewStats } from './models/ViewStats.js';
import { PRESENTATION_ARTICLES } from './data/presentation-articles.js';

// Additive: inserts the demo articles that are not in the database yet and never deletes anything.
// Run `npm run seed:presentation-users` first so the editors exist.
const EDITOR_NAMES = ['dana', 'yuval', 'shahar', 'noam', 'itay'];
const DAY_MS = 24 * 60 * 60 * 1000;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

await connectDatabase();

const editors = await User.find({ username: { $in: EDITOR_NAMES } });
if (editors.length === 0) {
  console.error('No presentation editors found. Run "npm run seed:presentation-users" first.');
  await disconnectDatabase();
  process.exit(1);
}

const existingTitles = new Set(
  (await Article.find({ 'published.title': { $in: PRESENTATION_ARTICLES.map(([, title]) => title) } })
    .select('published.title')).map((article) => article.published.title)
);

let created = 0;
for (const [index, [category, title, summary, paragraphs]] of PRESENTATION_ARTICLES.entries()) {
  if (existingTitles.has(title)) continue;

  const content = {
    title,
    summary,
    body: paragraphs.join('\n\n'),
    imageUrl: `https://picsum.photos/seed/daily-web-${index + 1}/800/450`,
    category
  };

  const reporter = editors[index % editors.length];
  const publisher = editors[(index + 1) % editors.length];
  const daysSincePublish = randomInt(2, 28);
  const publishedAt = new Date(Date.now() - daysSincePublish * DAY_MS);

  const article = await Article.create({
    reporter: reporter._id,
    status: 'published',
    draft: content,
    published: content,
    publishedVersion: 1,
    publishedAt,
    publicationEvents: [{ version: 1, publishedAt, publishedBy: publisher._id }]
  });

  // A few days of view history so the analytics dashboard has data to show.
  const buckets = [];
  let totalViews = 0;
  for (let d = daysSincePublish; d >= 0; d -= 1) {
    const bucketStart = new Date(Date.now() - d * DAY_MS);
    bucketStart.setHours(0, 0, 0, 0);
    const views = randomInt(5, 120);
    totalViews += views;
    buckets.push({ article: article._id, bucketStart, views, publicationVersion: 1 });
  }
  await ViewStats.insertMany(buckets);
  await Article.updateOne({ _id: article._id }, { $set: { viewCount: totalViews } });
  created += 1;
}

console.log(`Presentation articles: ${created} created, ${PRESENTATION_ARTICLES.length - created} already existed`);

await disconnectDatabase();
