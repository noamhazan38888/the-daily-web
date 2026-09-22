import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
	{
		article: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Article',
			required: true,
			index: true
		},
		author: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			default: null
		},
		guestName: {
			type: String,
			trim: true,
			maxlength: 80,
			default: 'אורח'
		},
		body: {
			type: String,
			required: true,
			trim: true,
			minlength: 1,
			maxlength: 2_000
		},
		status: {
			type: String,
			enum: ['visible', 'hidden'],
			default: 'visible',
			required: true
		}
	},
	{ timestamps: true }
);

commentSchema.index({ article: 1, status: 1, createdAt: 1 });

export const Comment = mongoose.model('Comment', commentSchema);
