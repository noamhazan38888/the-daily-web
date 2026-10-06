import { Article, ARTICLE_CONTENT_FIELDS } from '../models/Article.js';

// Workflow rules for the reporter (all other transitions belong to the editor):
//   new article            -> draft
//   draft / changes_requested  -> pending_review   (submitArticle)
//   published + edited      -> draft             (a new version; the approved one stays public)
// While an article is pending_review it is locked until the editor responds.
const EDITABLE_STATUSES = ['draft', 'changes_requested', 'published'];
const SUBMITTABLE_STATUSES = ['draft', 'changes_requested'];

function httpError(statusCode, message) {
	return Object.assign(new Error(message), { statusCode });
}

// Copies only the content fields that were sent, so the request body can never
// change the status, the owner or the published version.
function contentInput(body = {}) {
	const content = {};
	for (const field of ARTICLE_CONTENT_FIELDS) {
		const value = body[field];
		if (value === undefined) continue;
		if (value !== null && typeof value !== 'string') throw httpError(400, `Field "${field}" must be text`);
		content[field] = field === 'imageUrl' && !value?.trim() ? null : value;
	}
	return content;
}

function sameContent(first, second) {
	return ARTICLE_CONTENT_FIELDS.every((field) => (first?.[field] ?? '') === (second?.[field] ?? ''));
}

// Returns the problems that prevent a draft from being sent to the editor.
function incompleteFields(draft) {
	const problems = [];
	if ((draft.title ?? '').trim().length < 3) problems.push('כותרת (לפחות 3 תווים)');
	if (!draft.summary?.trim()) problems.push('תקציר');
	if (!draft.category?.trim()) problems.push('קטגוריה');
	if (!draft.body?.trim()) problems.push('תוכן הכתבה');
	if (draft.imageUrl && !/^(https?:\/\/|\/(?!\/))/i.test(draft.imageUrl)) problems.push('כתובת תמונה תקינה');
	return problems;
}

async function findOwnArticle(req) {
	const article = await Article.findOne({ _id: req.params.id, reporter: req.session.user.id });
	if (!article) throw httpError(404, 'Article not found');
	return article;
}

export async function listReporterArticles(req, res) {
	const articles = await Article.find({ reporter: req.session.user.id })
		.select('status draft.title draft.summary draft.category reviewNote publishedVersion updatedAt')
		.sort({ updatedAt: -1 });
	if (res.locals.pageView) return res.render('pages/workspace', { articles, role: 'reporter' });
	res.json({ articles });
}

export async function getReporterArticle(req, res) {
	const article = await Article.findOne({ _id: req.params.id, reporter: req.session.user.id });
	if (!article && res.locals.pageView) return res.status(404).render('pages/error', { title: 'הכתבה לא נמצאה', message: 'הכתבה אינה זמינה לעריכה.' });
	if (!article) return res.status(404).json({ error: 'Article not found' });
	if (res.locals.pageView) return res.render('pages/reporter-form', { article });
	res.json({ article });
}

export async function createArticle(req, res) {
	const article = await Article.create({
		reporter: req.session.user.id,
		draft: contentInput(req.body)
	});
	res.status(201).json({ article });
}

// Used by the auto-save, so it accepts partial content and is called many times.
export async function updateArticle(req, res) {
	const article = await findOwnArticle(req);
	if (!EDITABLE_STATUSES.includes(article.status)) {
		return res.status(409).json({ error: 'The article is waiting for editor review and cannot be edited' });
	}

	for (const [field, value] of Object.entries(contentInput(req.body))) {
		article.set(`draft.${field}`, value);
	}

	if (article.published) {
		// Editing a published article starts a new version. The approved version keeps
		// being shown to readers until the editor publishes the new one.
		const unchanged = sameContent(article.draft, article.published);
		if (article.status === 'published' && !unchanged) article.status = 'draft';
		if (article.status === 'draft' && unchanged) article.status = 'published';
	}

	await article.save();
	res.json({ article });
}

export async function submitArticle(req, res) {
	const article = await findOwnArticle(req);
	if (!SUBMITTABLE_STATUSES.includes(article.status)) {
		return res.status(409).json({ error: 'Only a draft or an article returned for changes can be submitted' });
	}

	const problems = incompleteFields(article.draft);
	if (problems.length) {
		return res.status(400).json({ error: `יש להשלים לפני השליחה: ${problems.join(', ')}`, fields: problems });
	}

	// The status condition makes the transition atomic if two submits arrive together.
	const submitted = await Article.findOneAndUpdate(
		{ _id: article._id, status: article.status },
		{ $set: { status: 'pending_review' } },
		{ new: true }
	);
	if (!submitted) return res.status(409).json({ error: 'The article status changed, reload the page' });
	res.json({ article: submitted });
}

export async function deleteArticle(req, res) {
	// An article that readers can see is never deleted by its reporter, only by an editor.
	const article = await Article.findOneAndDelete({
		_id: req.params.id,
		reporter: req.session.user.id,
		published: null,
		status: { $ne: 'pending_review' }
	});

	if (!article) return res.status(404).json({ error: 'Draft article not found' });
	res.status(204).send();
}
