import { Article } from '../models/Article.js';
import { ViewStats } from '../models/ViewStats.js';

export async function listArticles(req, res) {
	const filter = req.query.status ? { status: req.query.status } : {};
	const articles = await Article.find(filter)
		.populate('reporter', 'displayName username')
		.sort({ updatedAt: -1 });
	res.json({ articles });
}

export async function getArticle(req, res) {
	const article = await Article.findById(req.params.id).populate('reporter', 'displayName username');
	if (!article) return res.status(404).json({ error: 'Article not found' });
	res.json({ article });
}

export async function updateArticle(req, res) {
	const article = await Article.findById(req.params.id);
	if (!article) return res.status(404).json({ error: 'Article not found' });

	if (req.body.draft) article.draft = req.body.draft;
	if (req.body.reviewNote !== undefined) article.reviewNote = req.body.reviewNote;
	await article.save();
	res.json({ article });
}

export async function publishArticle(req, res) {
	const article = await Article.findById(req.params.id);
	if (!article) return res.status(404).json({ error: 'Article not found' });
	if (!['pending_review', 'published'].includes(article.status)) {
		return res.status(409).json({ error: 'Article is not ready for publication' });
	}

	article.status = 'published';
	article.published = article.draft;
	article.publishedVersion += 1;
	article.publishedAt = new Date();
	article.reviewNote = null;
	article.publicationEvents.push({
		version: article.publishedVersion,
		publishedAt: article.publishedAt,
		publishedBy: req.session.user.id
	});
	await article.save();
	res.json({ article });
}

export async function requestChanges(req, res) {
	const article = await Article.findByIdAndUpdate(
		req.params.id,
		{ $set: { status: 'changes_requested', reviewNote: req.body.reviewNote } },
		{ new: true, runValidators: true }
	);
	if (!article) return res.status(404).json({ error: 'Article not found' });
	res.json({ article });
}

export async function deleteArticle(req, res) {
	const article = await Article.findByIdAndDelete(req.params.id);
	if (!article) return res.status(404).json({ error: 'Article not found' });
	res.status(204).send();
}

export async function listViewStats(req, res) {
	const stats = await ViewStats.find({ article: req.params.id }).sort({ bucketStart: 1 });
	res.json({ stats });
}

export async function createViewStat(req, res) {
	const stat = await ViewStats.findOneAndUpdate(
		{ article: req.params.id, bucketStart: req.body.bucketStart },
		{
			$inc: { views: Number(req.body.views ?? 1) },
			$set: { publicationVersion: Number(req.body.publicationVersion ?? 0) }
		},
		{ new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
	);
	res.status(201).json({ stat });
}

export async function updateViewStat(req, res) {
	const stat = await ViewStats.findOneAndUpdate(
		{ _id: req.params.statId, article: req.params.id },
		{ $set: req.body },
		{ new: true, runValidators: true }
	);
	if (!stat) return res.status(404).json({ error: 'View stat not found' });
	res.json({ stat });
}

export async function deleteViewStat(req, res) {
	const stat = await ViewStats.findOneAndDelete({ _id: req.params.statId, article: req.params.id });
	if (!stat) return res.status(404).json({ error: 'View stat not found' });
	res.status(204).send();
}
