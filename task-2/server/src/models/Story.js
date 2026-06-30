const mongoose = require('mongoose');

const storySchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    media: {
      url: { type: String, required: true },
      publicId: String,
      type: { type: String, enum: ['image', 'video'], required: true },
    },
    text: { type: String, maxlength: 200, default: '' },
    textStyle: {
      color: { type: String, default: '#ffffff' },
      fontSize: { type: Number, default: 24 },
      position: { x: Number, y: Number },
    },
    background: { type: String, default: '' },
    viewers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        emoji: String,
      },
    ],
    duration: { type: Number, default: 5 }, // seconds
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

storySchema.index({ author: 1, expiresAt: 1 });

const Story = mongoose.model('Story', storySchema);
module.exports = Story;
