import mongoose from 'mongoose';

// One document per (device, article): records that the device opened the article.
const articleReadSchema = new mongoose.Schema(
	{
		viewerId: { type: String, required: true },
		article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true }
	},
	{ timestamps: true }
);

articleReadSchema.index({ viewerId: 1, article: 1 }, { unique: true });
articleReadSchema.index({ article: 1 });

export const ArticleRead = mongoose.model('ArticleRead', articleReadSchema);
