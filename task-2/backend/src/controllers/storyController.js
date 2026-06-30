const Story = require('../models/Story');
const User = require('../models/User');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// @route POST /api/stories
exports.createStory = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Media file required for story.' });

    const isVideo = req.file.mimetype.startsWith('video/');
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'novasphere/stories',
      resource_type: isVideo ? 'video' : 'image',
    });

    const story = await Story.create({
      author: req.user._id,
      media: { url: result.secure_url, publicId: result.public_id, type: isVideo ? 'video' : 'image' },
      text: req.body.text || '',
      duration: req.body.duration || 5,
    });

    await story.populate('author', 'username name avatar isVerified');
    res.status(201).json({ success: true, story });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/stories/feed
exports.getStoriesFeed = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const userIds = [...currentUser.following, req.user._id];

    const stories = await Story.find({
      author: { $in: userIds },
      expiresAt: { $gt: new Date() },
    })
      .populate('author', 'username name avatar isVerified')
      .sort({ createdAt: -1 });

    // Group by author
    const grouped = {};
    for (const story of stories) {
      const authorId = story.author._id.toString();
      if (!grouped[authorId]) {
        grouped[authorId] = { author: story.author, stories: [], hasUnviewed: false };
      }
      grouped[authorId].stories.push(story);
      if (!story.viewers.some((v) => v.user.toString() === req.user._id.toString())) {
        grouped[authorId].hasUnviewed = true;
      }
    }

    // Sort: unviewed first, then own stories first
    const result = Object.values(grouped).sort((a, b) => {
      if (a.author._id.toString() === req.user._id.toString()) return -1;
      if (b.author._id.toString() === req.user._id.toString()) return 1;
      return b.hasUnviewed - a.hasUnviewed;
    });

    res.json({ success: true, stories: result });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/stories/:id/view
exports.viewStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });

    const alreadyViewed = story.viewers.some((v) => v.user.toString() === req.user._id.toString());
    if (!alreadyViewed) {
      story.viewers.push({ user: req.user._id });
      await story.save();
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/stories/:id
exports.deleteStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });
    if (story.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    if (story.media.publicId) await deleteFromCloudinary(story.media.publicId, story.media.type);
    await story.deleteOne();
    res.json({ success: true, message: 'Story deleted.' });
  } catch (error) {
    next(error);
  }
};
