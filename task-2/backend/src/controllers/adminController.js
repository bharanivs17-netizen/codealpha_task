const User = require('../models/User');
const Post = require('../models/Post');
const Report = require('../models/Report');
const Notification = require('../models/Notification');

// =========== ADMIN USER MANAGEMENT ===========

// @route GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, banned } = req.query;
    const filter = {};
    if (search) filter.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    if (role) filter.role = role;
    if (banned !== undefined) filter.isBanned = banned === 'true';

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ success: true, users, total, page: Number(page) });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/users/:id/ban
exports.banUser = async (req, res, next) => {
  try {
    const { banned, reason } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isBanned: banned }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: `User ${banned ? 'banned' : 'unbanned'}.`, user });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/users/:id/role
exports.updateRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin', 'moderator'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Post.deleteMany({ author: req.params.id });
    res.json({ success: true, message: 'User and their posts deleted.' });
  } catch (error) {
    next(error);
  }
};

// =========== ADMIN POST MANAGEMENT ===========

// @route GET /api/admin/posts
exports.getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, flagged } = req.query;
    const filter = {};
    if (flagged === 'true') filter.isFlagged = true;

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'username name avatar')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Post.countDocuments(filter),
    ]);
    res.json({ success: true, posts, total });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/posts/:id
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
    res.json({ success: true, message: 'Post deleted.' });
  } catch (error) {
    next(error);
  }
};

// =========== REPORTS ===========

// @route GET /api/admin/reports
exports.getReports = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = status ? { status } : {};
    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporter', 'username name avatar')
        .populate('reportedUser', 'username name avatar')
        .populate('reportedPost', 'content media')
        .sort({ createdAt: -1 })
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit)),
      Report.countDocuments(filter),
    ]);
    res.json({ success: true, reports, total });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/reports/:id/review
exports.reviewReport = async (req, res, next) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// =========== ANALYTICS ===========

// @route GET /api/admin/analytics
exports.getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalPosts, newUsers, newPosts, bannedUsers, flaggedPosts, pendingReports] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments({ postType: 'post' }),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Post.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ isBanned: true }),
      Post.countDocuments({ isFlagged: true }),
      Report.countDocuments({ status: 'pending' }),
    ]);

    // Growth chart data (last 7 days)
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const growthData = await Promise.all(
      days.map(async (day) => {
        const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
        const [users, posts] = await Promise.all([
          User.countDocuments({ createdAt: { $gte: day, $lt: nextDay } }),
          Post.countDocuments({ createdAt: { $gte: day, $lt: nextDay }, postType: 'post' }),
        ]);
        return { date: day.toISOString().split('T')[0], users, posts };
      })
    );

    res.json({
      success: true,
      stats: { totalUsers, totalPosts, newUsers, newPosts, bannedUsers, flaggedPosts, pendingReports },
      growthData,
    });
  } catch (error) {
    next(error);
  }
};
