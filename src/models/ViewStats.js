import mongoose from 'mongoose';

const viewStatsSchema = new mongoose.Schema(
	{
		article: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Article',
			required: true,
			index: true
		},
		bucketStart: {
			type: Date,
			required: true
		},
		views: {
			type: Number,
			required: true,
			default: 0,
			min: 0
		},
		publicationVersion: {
			type: Number,
			required: true,
			min: 0
		}
	},
	{ timestamps: true }
);

viewStatsSchema.index({ article: 1, bucketStart: 1 }, { unique: true });

export const ViewStats = mongoose.model('ViewStats', viewStatsSchema);
