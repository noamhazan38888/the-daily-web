import { faker } from '@faker-js/faker';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { User } from './models/User.js';
import { Article } from './models/Article.js';
import { Comment } from './models/Comment.js';
import { ViewStats } from './models/ViewStats.js';

const TOTAL_ARTICLES = 500;
const CATEGORIES = ['חדשות', 'ספורט', 'טכנולוגיה', 'כלכלה', 'תרבות', 'בריאות'];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function daysAgo(n) {
  const date = new Date();
  date.setDate(date.getDate() - n);
  return date;
}

function makeContent() {
  return {
    title: faker.lorem.sentence({ min: 4, max: 8 }).replace(/\.$/, ''),
    summary: faker.lorem.sentences(2),
    body: faker.lorem.paragraphs(randomInt(4, 9), '\n\n'),
    imageUrl: faker.datatype.boolean(0.7) ? faker.image.urlPicsumPhotos() : null,
    category: randomItem(CATEGORIES)
  };
}

function buildPublicationEvents(editorIds, count, startDate) {
  const events = [];
  let currentDate = startDate;
  for (let version = 1; version <= count; version += 1) {
    events.push({
      version,
      publishedAt: new Date(currentDate),
      publishedBy: randomItem(editorIds)
    });
    currentDate = new Date(currentDate.getTime() + randomInt(3, 14) * 24 * 60 * 60 * 1000);
  }
  return events;
}

function buildArticle(reporterIds, editorIds, status, { isUpdate = false, multiVersion = false, needsReviewNote = false } = {}) {
  const article = {
    reporter: randomItem(reporterIds),
    status,
    draft: makeContent(),
    published: null,
    publishedVersion: 0,
    publishedAt: null,
    reviewNote: needsReviewNote ? faker.lorem.sentences(2) : null,
    publicationEvents: [],
    viewCount: 0
  };

  if (status === 'published') {
    const versionCount = multiVersion ? randomInt(2, 3) : 1;
    const firstPublishDate = daysAgo(randomInt(10, 60));
    article.publicationEvents = buildPublicationEvents(editorIds, versionCount, firstPublishDate);
    article.publishedVersion = versionCount;
    article.publishedAt = article.publicationEvents[article.publicationEvents.length - 1].publishedAt;
    article.published = { ...article.draft };
  } else if (isUpdate) {
    // Already approved once; a new draft is now waiting on the editor, old published snapshot stays live.
    const firstPublishDate = daysAgo(randomInt(15, 90));
    article.publicationEvents = buildPublicationEvents(editorIds, 1, firstPublishDate);
    article.publishedVersion = 1;
    article.publishedAt = article.publicationEvents[0].publishedAt;
    article.published = makeContent();
  }

  return article;
}

async function seedUsers() {
  const userSeeds = [
    { username: 'reporter.demo', displayName: 'כתב הדגמה', role: 'reporter', password: 'Reporter123!' },
    { username: 'editor.demo', displayName: 'עורך הדגמה', role: 'editor', password: 'Editor123!' },
    ...Array.from({ length: 4 }, (_, i) => ({
      username: `reporter.${i + 1}`,
      displayName: faker.person.fullName(),
      role: 'reporter',
      password: `Reporter${i + 1}23!`
    })),
    { username: 'editor.senior', displayName: faker.person.fullName(), role: 'editor', password: 'EditorSenior23!' }
  ];

  const users = [];
  for (const userData of userSeeds) {
    const user = await User.findOneAndUpdate(
      { username: userData.username },
      { $set: { displayName: userData.displayName, role: userData.role } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('+passwordHash');

    user.setPassword(userData.password);
    await user.save();
    users.push(user);
  }
  return users;
}

async function seedArticles(reporterIds, editorIds) {
  const plan = [
    ['draft', 90, {}],
    ['pending_review', 60, {}],
    ['pending_review', 20, { isUpdate: true }],
    ['changes_requested', 38, { needsReviewNote: true }],
    ['changes_requested', 12, { isUpdate: true, needsReviewNote: true }],
    ['published', 210, {}],
    ['published', 70, { multiVersion: true }]
  ];

  const articles = [];
  for (const [status, count, options] of plan) {
    for (let i = 0; i < count; i += 1) {
      articles.push(buildArticle(reporterIds, editorIds, status, options));
    }
  }

  return Article.insertMany(articles);
}

async function seedViewStats(articles) {
  const ops = [];
  for (const article of articles) {
    if (!article.published) continue;
    const days = randomInt(10, 30);
    let totalViews = 0;
    for (let d = days; d >= 0; d -= 1) {
      const bucketStart = daysAgo(d);
      bucketStart.setHours(0, 0, 0, 0);

      let version = 0;
      for (const event of article.publicationEvents) {
        if (event.publishedAt <= bucketStart) version = event.version;
      }
      if (version === 0) continue;

      const views = randomInt(5, 200);
      totalViews += views;
      ops.push({
        updateOne: {
          filter: { article: article._id, bucketStart },
          update: { $set: { views, publicationVersion: version } },
          upsert: true
        }
      });
    }
    article.viewCount = totalViews;
  }

  if (ops.length) await ViewStats.bulkWrite(ops);

  await Promise.all(
    articles
      .filter((article) => article.published)
      .map((article) => Article.updateOne({ _id: article._id }, { $set: { viewCount: article.viewCount } }))
  );
}

async function seedComments(articles, userIds) {
  const comments = [];
  for (const article of articles) {
    if (!article.published) continue;
    const count = randomInt(0, 8);
    for (let i = 0; i < count; i += 1) {
      const isGuest = Math.random() < 0.9;
      comments.push({
        article: article._id,
        author: isGuest ? null : randomItem(userIds),
        guestName: isGuest ? faker.person.fullName() : 'אורח',
        body: faker.lorem.sentences(randomInt(1, 3)),
        status: Math.random() < 0.95 ? 'visible' : 'hidden'
      });
    }
  }
  if (comments.length) await Comment.insertMany(comments);
  return comments.length;
}

await connectDatabase();

const users = await seedUsers();
const reporters = users.filter((user) => user.role === 'reporter');
const editors = users.filter((user) => user.role === 'editor');
console.log(`Users ready: ${reporters.length} reporters, ${editors.length} editors`);

await Article.deleteMany({});
await Comment.deleteMany({});
await ViewStats.deleteMany({});

const reporterIds = reporters.map((user) => user._id);
const editorIds = editors.map((user) => user._id);
const articles = await seedArticles(reporterIds, editorIds);
console.log(`Articles created: ${articles.length} (target ${TOTAL_ARTICLES})`);

await seedViewStats(articles);
const commentCount = await seedComments(articles, users.map((user) => user._id));

const statusCounts = await Article.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
const viewStatCount = await ViewStats.countDocuments();

console.log('Article status breakdown:', statusCounts.map(({ _id, count }) => `${_id}: ${count}`).join(', '));
console.log(`Comments created: ${commentCount}`);
console.log(`ViewStats buckets created: ${viewStatCount}`);
console.log('Demo users: reporter.demo / Reporter123!, editor.demo / Editor123!');

await disconnectDatabase();
