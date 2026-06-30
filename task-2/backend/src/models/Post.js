const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, maxlength: 500 },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        content: { type: String, maxlength: 500 },
        likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      maxlength: 2200,
      default: '',
    },
    media: [
      {
        url: String,
        publicId: String,
        type: { type: String, enum: ['image', 'video'] },
        thumbnail: String,
      },
    ],
    hashtags: [String],
    mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    isRepost: { type: Boolean, default: false },
    originalPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    visibility: {
      type: String,
      enum: ['public', 'followers', 'private'],
      default: 'public',
    },
    postType: {
      type: String,
      enum: ['post', 'reel', 'story'],
      default: 'post',
    },
    location: String,
    aiSummary: String,
    isFlagged: { type: Boolean, default: false },
    flagReason: String,
    views: { type: Number, default: 0 },
    trending: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: likes count
postSchema.virtual('likesCount').get(function () {
  return this.likes ? this.likes.length : 0;
});
postSchema.virtual('commentsCount').get(function () {
  return this.comments ? this.comments.length : 0;
});

// Auto-parse hashtags from content
postSchema.pre('save', function (next) {
  if (this.isModified('content') && this.content) {
    const hashtags = this.content.match(/#[\w]+/g);
    this.hashtags = hashtags ? [...new Set(hashtags.map((h) => h.toLowerCase().slice(1)))] : [];
  }
  next();
});

// Trending score calculation
postSchema.methods.calculateTrending = function () {
  const ageHours = (Date.now() - new Date(this.createdAt).getTime()) / 3600000;
  const score =
    (this.likes.length * 2 + this.comments.length * 3 + this.reposts.length * 4 + this.views * 0.1) /
    Math.pow(ageHours + 2, 1.5);
  this.trending = score;
};

// Indexes for performance
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ hashtags: 1 });
postSchema.index({ trending: -1 });
postSchema.index({ createdAt: -1 });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
