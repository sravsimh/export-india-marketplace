const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, adminOnly, ownerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('exportData.exportCategories', 'name slug')
      .select('-password');

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().matches(/^[\+]?[1-9][\d]{0,15}$/).withMessage('Invalid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'avatar', 'businessInfo', 'addresses', 'socialMedia', 'settings'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key) && req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });

    Object.keys(updates).forEach(key => {
      user[key] = updates[key];
    });

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: await User.findById(user._id).select('-password')
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (public info only)
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id)
      .select('firstName lastName avatar role businessInfo rating exportData socialMedia createdAt')
      .populate('exportData.exportCategories', 'name slug');

    if (!user || user.status !== 'active') {
      return res.status(404).json({ message: 'User not found' });
    }

    // Filter sensitive information based on privacy settings
    const publicUser = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      role: user.role,
      businessInfo: user.businessInfo,
      rating: user.rating,
      exportData: user.exportData,
      socialMedia: user.socialMedia,
      memberSince: user.createdAt
    };

    // Apply privacy settings
    if (user.settings?.privacy?.showEmail === false) {
      delete publicUser.email;
    }

    res.json({ user: publicUser });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', auth, adminOnly, [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('role').optional().isIn(['buyer', 'exporter', 'admin']).withMessage('Invalid role'),
  query('status').optional().isIn(['active', 'suspended', 'pending']).withMessage('Invalid status'),
  query('verified').optional().isBoolean().withMessage('Verified must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, role, status, verified, search } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {};
    
    if (role) query.role = role;
    if (status) query.status = status;
    if (verified !== undefined) query.isVerified = verified === 'true';
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { 'businessInfo.companyName': new RegExp(search, 'i') }
      ];
    }

    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (Admin only)
// @access  Private (Admin)
router.put('/:id/status', auth, adminOnly, [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('status').isIn(['active', 'suspended', 'pending']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = req.body.status;
    await user.save();

    res.json({
      message: `User status updated to ${req.body.status}`,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only or self)
// @access  Private
router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid user ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if admin or self
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Don't allow deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;