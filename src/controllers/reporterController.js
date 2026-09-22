import { Article } from '../models/Article.js';

function articleInput(body) {
	return {
		title: body.title,
		summary: body.summary,
		body: body.body,
		imageUrl: body.imageUrl,
		category: body.category
	};
}

export async function listReporterArticles(req, res) {
	const articles = await Article.find({ reporter: req.session.user.id })
		.sort({ updatedAt: -1 });
	res.json({ articles });
}

export async function getReporterArticle(req, res) {
	const article = await Article.findOne({ _id: req.params.id, reporter: req.session.user.id });
	if (!article) return res.status(404).json({ error: 'Article not found' });
	res.json({ article });
}

export async function createArticle(req, res) {
	const article = await Article.create({
		reporter: req.session.user.id,
		draft: articleInput(req.body)
	});
	res.status(201).json({ article });
}

export async function updateArticle(req, res) {
	const article = await Article.findOne({ _id: req.params.id, reporter: req.session.user.id });
	if (!article) return res.status(404).json({ error: 'Article not found' });

	article.draft = articleInput(req.body);
	if (article.status === 'published') article.status = 'pending_review';
	if (article.status === 'changes_requested') article.reviewNote = null;
	await article.save();

	res.json({ article });
}

export async function deleteArticle(req, res) {
	const article = await Article.findOneAndDelete({
		_id: req.params.id,
		reporter: req.session.user.id,
		status: { $ne: 'published' }
	});

	if (!article) return res.status(404).json({ error: 'Draft article not found' });
	res.status(204).send();
}
