import { Article } from '../models/Article.js';
import { Comment } from '../models/Comment.js';

export async function listPublishedArticles(req, res) {

	const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
	const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 50);
	const query = { status: 'published' };

	if (req.query.category) query['published.category'] = String(req.query.category).trim();
	if (req.query.search) query.$text = { $search: String(req.query.search).trim() };

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

	res.json({ articles, page, limit, total, hasMore: page * limit < total });
}

export async function getPublishedArticle(req, res) {
	const article = await Article.findOne({ _id: req.params.id, status: 'published' })
		.populate('reporter', 'displayName username');

	if (!article) return res.status(404).json({ error: 'Article not found' });
	res.json({ article });
}

export async function listArticleComments(req, res) {
	const comments = await Comment.find({ article: req.params.id, status: 'visible' })
		.populate('author', 'displayName username')
		.sort({ createdAt: 1 });

	res.json({ comments });
}

export async function createComment(req, res) {
	const article = await Article.exists({ _id: req.params.id, status: 'published' });
	if (!article) return res.status(404).json({ error: 'Published article not found' });

	const comment = await Comment.create({
		article: req.params.id,
		author: req.session.user?.id ?? null,
		guestName: req.body.guestName,
		body: req.body.body
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
