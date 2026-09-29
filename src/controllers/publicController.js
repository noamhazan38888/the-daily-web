import { Article } from '../models/Article.js';
import { Comment } from '../models/Comment.js';

export async function listPublishedArticles(req, res) {

	const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
	const query = { status: 'published' };

	if (req.query.search) {
		const term = String(req.query.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		if (term) query['published.title'] = { $regex: term, $options: 'i' };
	}
	if (req.query.category) {
		const term = String(req.query.category).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		if (term) query['published.category'] = { $regex: term, $options: 'i' };
	}

	const sort = req.query.sort === 'popular' ? { viewCount: -1, publishedAt: -1 } : { publishedAt: -1 };
	const [articles, total] = await Promise.all([
		Article.find(query)
			.select('reporter published publishedVersion publishedAt viewCount')
			.populate('reporter', 'displayName username')
			.sort(sort)
			.skip((page - 1) * limit)
			.limit(limit),
		Article.countDocuments(query)
	]);

	const data = { articles, page, limit, total, hasMore: page * limit < total };
	if (res.locals.pageView) return res.render('pages/home', data);
	res.json(data);
}

export async function getPublishedArticle(req, res) {
	const [article, comments] = await Promise.all([
		Article.findOne({ _id: req.params.id, status: 'published' })
			.populate('reporter', 'displayName username'),
		Comment.find({ article: req.params.id, status: 'visible' })
			.populate('author', 'displayName username')
			.sort({ createdAt: 1 })
	]);

	if (!article && res.locals.pageView) return res.status(404).render('pages/error', { title: 'הכתבה לא נמצאה', message: 'הכתבה אינה זמינה לצפייה.' });
	if (!article) return res.status(404).json({ error: 'Article not found' });
	if (res.locals.pageView) return res.render('pages/article', { article, comments });
	res.json({ article });
}

export async function listArticleComments(req, res) {
	const comments = await Comment.find({ article: req.params.id, status: 'visible' })
		.populate('author', 'displayName username')
		.sort({ createdAt: 1 });

	res.json({ comments });
}

// In-memory spam guard: sessionID → array of submission timestamps
const guestCommentLog = new Map();
const SPAM_MAX = 3;
const SPAM_WINDOW_MS = 60_000;

function isSpam(sessionId) {
	const now = Date.now();
	const hits = (guestCommentLog.get(sessionId) ?? []).filter(t => now - t < SPAM_WINDOW_MS);
	if (hits.length >= SPAM_MAX) {
		guestCommentLog.set(sessionId, hits);
		return true;
	}
	hits.push(now);
	guestCommentLog.set(sessionId, hits);
	return false;
}

// Purge fully-expired entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
	const now = Date.now();
	for (const [key, hits] of guestCommentLog) {
		if (!hits.some(t => now - t < SPAM_WINDOW_MS)) guestCommentLog.delete(key);
	}
}, 5 * 60_000);

export async function createComment(req, res) {
	// Rate-limit guests only; logged-in staff are trusted
	if (!req.session?.user && req.sessionID && isSpam(req.sessionID)) {
		return res.status(429).json({ error: 'שלחת יותר מדי תגובות. המתן דקה ונסה שוב.' });
	}

	const body = String(req.body.body ?? '').trim();
	if (!body) return res.status(400).json({ error: 'תגובה לא יכולה להיות ריקה.' });

	const article = await Article.exists({ _id: req.params.id, status: 'published' });
	if (!article) return res.status(404).json({ error: 'Published article not found' });

	const comment = await Comment.create({
		article: req.params.id,
		author: req.session.user?.id ?? null,
		guestName: req.body.guestName ? String(req.body.guestName).trim().slice(0, 80) : undefined,
		body,
	});

	const populatedComment = await comment.populate('author', 'displayName username');
	res.status(201).json({ comment: populatedComment });
}

export async function updateComment(req, res) {
	const comment = await Comment.findByIdAndUpdate(
		req.params.commentId,
		{ $set: { body: req.body.body } },
		{ new: true, runValidators: true }
	);

	if (!comment) return res.status(404).json({ error: 'Comment not found' });
	res.json({ comment });
}

export async function deleteComment(req, res) {
	const comment = await Comment.findByIdAndDelete(req.params.commentId);
	if (!comment) return res.status(404).json({ error: 'Comment not found' });
	res.status(204).send();
}
