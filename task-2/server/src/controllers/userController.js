const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// @route GET /api/users/:username
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password -refreshToken -emailVerificationToken -passwordResetToken')
      .populate('followers', 'username name avatar')
      .populate('following', 'username name avatar');

    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const postsCount = await Post.countDocuments({ author: user._id, postType: 'post' });
    const isFollowing = req.user ? user.followers.some((f) => f._id.toString() === req.user._id.toString()) : false;
    const isOwnProfile = req.user ? req.user._id.toString() === user._id.toString() : false;

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        avatar: user.avatar || user.getAvatarUrl(),
        postsCount,
        isFollowing,
        isOwnProfile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/users/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, website, location, username } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (website !== undefined) updates.website = website;
    if (location !== undefined) updates.location = location;

    if (username && username !== req.user.username) {
      const exists = await User.findOne({ username: username.toLowerCase() });
      if (exists) return res.status(400).json({ success: false, message: 'Username already taken.' });
      updates.username = username.toLowerCase();
    }

    // Handle avatar upload
    if (req.files?.avatar) {
      const avatarResult = await uploadToCloudinary(req.files.avatar[0].buffer, {
        folder: 'novasphere/avatars',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      });
      if (req.user.avatar && req.user.avatar.includes('cloudinary')) {
        const publicId = req.user.avatar.split('/').slice(-1)[0].split('.')[0];
        await deleteFromCloudinary(`novasphere/avatars/${publicId}`);
      }
      updates.avatar = avatarResult.secure_url;
    }

    // Handle cover photo upload
    if (req.files?.coverPhoto) {
      const coverResult = await uploadToCloudinary(req.files.coverPhoto[0].buffer, {
        folder: 'novasphere/covers',
        transformation: [{ width: 1200, height: 400, crop: 'fill' }],
      });
      updates.coverPhoto = coverResult.secure_url;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -refreshToken');

    res.json({ success: true, user: { ...user.toObject(), avatar: user.avatar || user.getAvatarUrl() } });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/users/:id/follow
exports.followUser = async (req, res, next) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found.' });
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You can't follow yourself." });
    }

    const isFollowing = targetUser.followers.includes(req.user._id);

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(targetUser._id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: targetUser._id } });
      return res.json({ success: true, following: false, message: 'Unfollowed.' });
    } else {
      // Follow
      await User.findByIdAndUpdate(targetUser._id, { $addToSet: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $addToSet: { following: targetUser._id } });

      // Create notification
      if (targetUser._id.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: targetUser._id,
          sender: req.user._id,
          type: 'follow',
        });
        // Emit via socket
        if (req.io) {
          req.io.to(targetUser._id.toString()).emit('notification', {
            type: 'follow',
            sender: { _id: req.user._id, username: req.user.username, avatar: req.user.avatar },
          });
        }
      }
      return res.json({ success: true, following: true, message: 'Following.' });
    }
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/search
exports.searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    if (!q) return res.json({ success: true, users: [] });

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { name: { $regex: q, $options: 'i' } },
      ],
      isActive: true,
      isBanned: false,
    })
      .select('username name avatar isVerified bio followersCount')
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/suggestions
exports.getSuggestions = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    const suggestions = await User.find({
      _id: { $nin: [...currentUser.following, req.user._id] },
      isActive: true,
      isBanned: false,
    })
      .select('username name avatar isVerified bio')
      .limit(5)
      .sort({ followersCount: -1 });

    res.json({ success: true, suggestions });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/:id/followers
exports.getFollowers = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('followers', 'username name avatar isVerified bio');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, followers: user.followers });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/:id/following
exports.getFollowing = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).populate('following', 'username name avatar isVerified bio');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, following: user.following });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/users/:username/saved-posts
exports.getSavedPosts = async (req, res, next) => {
  try {
    if (req.user.username !== req.params.username && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const user = await User.findOne({ username: req.params.username }).populate({
      path: 'savedPosts',
      populate: { path: 'author', select: 'username name avatar isVerified' },
    });
    res.json({ success: true, savedPosts: user.savedPosts });
  } catch (error) {
    next(error);
  }
};
