const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// @route POST /api/posts
exports.createPost = async (req, res, next) => {
  try {
    const { content, visibility, location, postType } = req.body;
    if (!content && (!req.files || req.files.length === 0)) {
      return res.status(400).json({ success: false, message: 'Post must have content or media.' });
    }

    const media = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const isVideo = file.mimetype.startsWith('video/');
        const result = await uploadToCloudinary(file.buffer, {
          folder: 'novasphere/posts',
          resource_type: isVideo ? 'video' : 'image',
          ...(isVideo && { transformation: [{ quality: 'auto' }] }),
        });
        media.push({
          url: result.secure_url,
          publicId: result.public_id,
          type: isVideo ? 'video' : 'image',
          thumbnail: isVideo ? result.secure_url.replace('/upload/', '/upload/so_0,w_400/') : undefined,
        });
      }
    }

    const post = await Post.create({
      author: req.user._id,
      content: content || '',
      media,
      visibility: visibility || 'public',
      location,
      postType: postType || 'post',
    });

    await post.populate('author', 'username name avatar isVerified');

    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/posts/feed
exports.getFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let query = { postType: 'post', visibility: 'public' };
    if (req.user) {
      const currentUser = await User.findById(req.user._id);
      const followingIds = [...currentUser.following, req.user._id];
      query = {
        postType: 'post',
        $or: [{ author: { $in: followingIds } }, { visibility: 'public' }],
      };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('author', 'username name avatar isVerified')
      .populate('originalPost', 'content author media')
      .lean();

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      posts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: skip + posts.length < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/posts/trending
exports.getTrending = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const posts = await Post.find({ postType: 'post', visibility: 'public' })
      .sort({ trending: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('author', 'username name avatar isVerified')
      .lean();

    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/posts/:id
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('author', 'username name avatar isVerified')
      .populate('comments.user', 'username name avatar isVerified')
      .populate('comments.replies.user', 'username name avatar');

    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/posts/:id
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this post.' });
    }

    const { content, visibility } = req.body;
    if (content !== undefined) post.content = content;
    if (visibility) post.visibility = visibility;
    await post.save();

    res.json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/posts/:id
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    // Delete media from Cloudinary
    for (const m of post.media) {
      if (m.publicId) await deleteFromCloudinary(m.publicId, m.type);
    }

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted.' });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/posts/:id/like
exports.likePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const isLiked = post.likes.includes(req.user._id);
    if (isLiked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
      // Notify post author
      if (post.author.toString() !== req.user._id.toString()) {
        await Notification.create({ recipient: post.author, sender: req.user._id, type: 'like', post: post._id });
        if (req.io) req.io.to(post.author.toString()).emit('notification', { type: 'like', postId: post._id });
      }
    }
    post.calculateTrending();
    await post.save();
    res.json({ success: true, liked: !isLiked, likesCount: post.likes.length });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/posts/:id/comment
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Comment content required.' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    post.comments.push({ user: req.user._id, content });
    post.calculateTrending();
    await post.save();
    await post.populate('comments.user', 'username name avatar isVerified');

    const newComment = post.comments[post.comments.length - 1];

    if (post.author.toString() !== req.user._id.toString()) {
      await Notification.create({ recipient: post.author, sender: req.user._id, type: 'comment', post: post._id });
      if (req.io) req.io.to(post.author.toString()).emit('notification', { type: 'comment', postId: post._id });
    }

    res.status(201).json({ success: true, comment: newComment, commentsCount: post.comments.length });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/posts/:id/comment/:commentId
exports.deleteComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });

    if (comment.user.toString() !== req.user._id.toString() &&
      post.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    comment.deleteOne();
    await post.save();
    res.json({ success: true, message: 'Comment deleted.', commentsCount: post.comments.length });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/posts/:id/save
exports.savePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });

    const user = await User.findById(req.user._id);
    const isSaved = user.savedPosts.includes(post._id);

    if (isSaved) {
      user.savedPosts.pull(post._id);
      post.saves.pull(req.user._id);
    } else {
      user.savedPosts.push(post._id);
      post.saves.push(req.user._id);
    }

    await Promise.all([user.save({ validateBeforeSave: false }), post.save()]);
    res.json({ success: true, saved: !isSaved });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/posts/:id/repost
exports.repost = async (req, res, next) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    if (!originalPost) return res.status(404).json({ success: false, message: 'Post not found.' });

    const existingRepost = await Post.findOne({
      author: req.user._id, isRepost: true, originalPost: originalPost._id,
    });

    if (existingRepost) {
      await existingRepost.deleteOne();
      originalPost.reposts.pull(req.user._id);
      await originalPost.save();
      return res.json({ success: true, reposted: false });
    }

    const repost = await Post.create({
      author: req.user._id,
      content: req.body.content || '',
      isRepost: true,
      originalPost: originalPost._id,
      postType: 'post',
    });
    originalPost.reposts.push(req.user._id);
    originalPost.calculateTrending();
    await originalPost.save();

    res.status(201).json({ success: true, reposted: true, post: repost });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/posts/hashtag/:tag
exports.getByHashtag = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const posts = await Post.find({ hashtags: req.params.tag.toLowerCase(), visibility: 'public' })
      .sort({ trending: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('author', 'username name avatar isVerified');

    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/posts/user/:username
exports.getUserPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, type = 'post' } = req.query;
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const posts = await Post.find({ author: user._id, postType: type })
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('author', 'username name avatar isVerified');

    const total = await Post.countDocuments({ author: user._id, postType: type });
    res.json({ success: true, posts, total, hasMore: posts.length === Number(limit) });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/posts/search
exports.searchPosts = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q) return res.json({ success: true, posts: [] });

    const posts = await Post.find({
      $or: [
        { content: { $regex: q, $options: 'i' } },
        { hashtags: { $regex: q, $options: 'i' } },
      ],
      visibility: 'public',
      postType: 'post',
    })
      .sort({ trending: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('author', 'username name avatar isVerified');

    res.json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/posts/reels
exports.getReels = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const reels = await Post.find({ postType: 'reel', visibility: 'public' })
      .sort({ trending: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('author', 'username name avatar isVerified');
    res.json({ success: true, reels });
  } catch (error) {
    next(error);
  }
};
