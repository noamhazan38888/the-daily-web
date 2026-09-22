import mongoose from 'mongoose';

const articleContentSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
			minlength: 3,
			maxlength: 200
		},
		summary: {
			type: String,
			required: true,
			trim: true,
			maxlength: 500
		},
		body: {
			type: String,
			required: true,
			minlength: 1
		},
		imageUrl: {
			type: String,
			trim: true,
			maxlength: 2_000,
			default: null
		},
		category: {
			type: String,
			required: true,
			trim: true,
			maxlength: 80
		}
	},
	{ _id: false }
);

const publicationEventSchema = new mongoose.Schema(
	{
		version: { type: Number, required: true, min: 1 },
		publishedAt: { type: Date, required: true },
		publishedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true
		}
	},
	{ _id: false }
);

const articleSchema = new mongoose.Schema(
	{
		reporter: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
			index: true
		},
		status: {
			type: String,
			enum: ['draft', 'pending_review', 'published', 'changes_requested'],
			default: 'draft',
			required: true,
			index: true
		},
		draft: {
			type: articleContentSchema,
			required: true
		},
		published: {
			type: articleContentSchema,
			default: null
		},
		publishedVersion: {
			type: Number,
			default: 0,
			min: 0
		},
		publishedAt: {
			type: Date,
			default: null,
			index: true
		},
		reviewNote: {
			type: String,
			trim: true,
			maxlength: 2_000,
			default: null
		},
		publicationEvents: {
			type: [publicationEventSchema],
			default: []
		},
		viewCount: {
			type: Number,
			default: 0,
			min: 0
		}
	},
	{ timestamps: true }
);

articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ 'draft.title': 'text', 'published.title': 'text' });

export const Article = mongoose.model('Article', articleSchema);
