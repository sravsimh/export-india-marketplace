const express = require('express');
const { body, query, param, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories (tree structure or flat)
// @access  Public
router.get('/', [
  query('tree').optional().isBoolean().withMessage('Tree parameter must be boolean'),
  query('featured').optional().isBoolean().withMessage('Featured parameter must be boolean'),
  query('homepage').optional().isBoolean().withMessage('Homepage parameter must be boolean'),
  query('level').optional().isInt({ min: 0 }).withMessage('Level must be non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { tree, featured, homepage, level, parent } = req.query;

    let categories;

    if (tree === 'true') {
      // Return hierarchical tree structure
      categories = await Category.buildTree();
    } else if (featured === 'true') {
      // Return featured categories
      categories = await Category.getFeaturedCategories();
    } else if (homepage === 'true') {
      // Return homepage categories
      categories = await Category.getHomepageCategories();
    } else {
      // Return flat list with optional filters
      const query = { isActive: true, isVisible: true };
      
      if (level !== undefined) {
        query.level = parseInt(level);
      }
      
      if (parent) {
        query.parent = parent === 'null' ? null : parent;
      }

      categories = await Category.find(query)
        .populate('parent', 'name slug')
        .sort({ level: 1, displayOrder: 1, name: 1 })
        .select('-__v');
    }

    res.json({
      categories,
      total: categories.length
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error while fetching categories' });
  }
});

// @route   GET /api/categories/:id
// @desc    Get single category by ID or slug
// @access  Public
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to find by ID first, then by slug
    let category;
    if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a valid ObjectId
      category = await Category.findById(identifier);
    } else {
      // It's a slug
      category = await Category.findOne({ slug: identifier, isActive: true, isVisible: true });
    }

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Get additional information
    const [ancestors, children, siblings] = await Promise.all([
      category.getAncestors(),
      category.getChildren(),
      category.getSiblings()
    ]);

    res.json({
      category,
      ancestors,
      children,
      siblings
    });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ message: 'Server error while fetching category' });
  }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private (Admin only)
router.post('/', auth, adminOnly, [
  body('name').notEmpty().withMessage('Category name is required'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('parent').optional().isMongoId().withMessage('Invalid parent category ID'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be non-negative'),
  body('hsCodePrefixes').optional().isArray().withMessage('HS code prefixes must be an array'),
  body('keywords').optional().isArray().withMessage('Keywords must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if parent category exists (if provided)
    if (req.body.parent) {
      const parentCategory = await Category.findById(req.body.parent);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Invalid parent category' });
      }
    }

    const category = new Category(req.body);
    await category.save();

    // Populate parent for response
    await category.populate('parent', 'name slug level');

    res.status(201).json({
      message: 'Category created successfully',
      category
    });

  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Category name or slug already exists' });
    } else {
      res.status(500).json({ message: 'Server error while creating category' });
    }
  }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin only)
router.put('/:id', auth, adminOnly, [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('name').optional().notEmpty().withMessage('Category name cannot be empty'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description too long'),
  body('parent').optional().isMongoId().withMessage('Invalid parent category ID'),
  body('displayOrder').optional().isInt({ min: 0 }).withMessage('Display order must be non-negative')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if trying to set self as parent
    if (req.body.parent && req.body.parent === req.params.id) {
      return res.status(400).json({ message: 'Category cannot be its own parent' });
    }

    // Check if parent category exists (if provided)
    if (req.body.parent) {
      const parentCategory = await Category.findById(req.body.parent);
      if (!parentCategory) {
        return res.status(400).json({ message: 'Invalid parent category' });
      }

      // Check for circular reference
      const descendants = await category.getDescendants();
      const descendantIds = descendants.map(d => d._id.toString());
      if (descendantIds.includes(req.body.parent)) {
        return res.status(400).json({ message: 'Cannot create circular reference' });
      }
    }

    // Update category
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        category[key] = req.body[key];
      }
    });

    await category.save();

    // Populate parent for response
    await category.populate('parent', 'name slug level');

    res.json({
      message: 'Category updated successfully',
      category
    });

  } catch (error) {
    console.error('Update category error:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Category name or slug already exists' });
    } else {
      res.status(500).json({ message: 'Server error while updating category' });
    }
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin only)
router.delete('/:id', auth, adminOnly, [
  param('id').isMongoId().withMessage('Invalid category ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Check if category has children
    const children = await Category.find({ parent: req.params.id });
    if (children.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category with subcategories. Delete or reassign subcategories first.' 
      });
    }

    // Check if category has products
    const Product = require('../models/Product');
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete category with ${productCount} products. Reassign products first.` 
      });
    }

    await Category.findByIdAndDelete(req.params.id);

    res.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ message: 'Server error while deleting category' });
  }
});

// @route   GET /api/categories/search/:query
// @desc    Search categories
// @access  Public
router.get('/search/:query', [
  param('query').notEmpty().withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { query } = req.params;
    const { limit = 10 } = req.query;

    const categories = await Category.searchCategories(query, parseInt(limit));

    res.json({
      categories,
      total: categories.length,
      query
    });

  } catch (error) {
    console.error('Search categories error:', error);
    res.status(500).json({ message: 'Server error while searching categories' });
  }
});

// @route   POST /api/categories/:id/reorder
// @desc    Reorder categories within same parent
// @access  Private (Admin only)
router.post('/:id/reorder', auth, adminOnly, [
  param('id').isMongoId().withMessage('Invalid category ID'),
  body('newOrder').isInt({ min: 0 }).withMessage('New order must be non-negative integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { newOrder } = req.body;
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const oldOrder = category.displayOrder;
    
    // Get siblings (categories with same parent)
    const siblings = await Category.find({ parent: category.parent })
      .sort({ displayOrder: 1 });

    // Update display orders
    if (newOrder > oldOrder) {
      // Moving down - decrease order of categories in between
      await Category.updateMany(
        { 
          parent: category.parent,
          displayOrder: { $gt: oldOrder, $lte: newOrder }
        },
        { $inc: { displayOrder: -1 } }
      );
    } else if (newOrder < oldOrder) {
      // Moving up - increase order of categories in between
      await Category.updateMany(
        { 
          parent: category.parent,
          displayOrder: { $gte: newOrder, $lt: oldOrder }
        },
        { $inc: { displayOrder: 1 } }
      );
    }

    // Update the category itself
    category.displayOrder = newOrder;
    await category.save();

    res.json({
      message: 'Category reordered successfully',
      category: {
        id: category._id,
        name: category.name,
        displayOrder: category.displayOrder
      }
    });

  } catch (error) {
    console.error('Reorder category error:', error);
    res.status(500).json({ message: 'Server error while reordering category' });
  }
});

// @route   PUT /api/categories/:id/toggle-status
// @desc    Toggle category active/inactive status
// @access  Private (Admin only)
router.put('/:id/toggle-status', auth, adminOnly, [
  param('id').isMongoId().withMessage('Invalid category ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    category.isActive = !category.isActive;
    await category.save();

    res.json({
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      category: {
        id: category._id,
        name: category.name,
        isActive: category.isActive
      }
    });

  } catch (error) {
    console.error('Toggle category status error:', error);
    res.status(500).json({ message: 'Server error while toggling category status' });
  }
});

// @route   GET /api/categories/:id/products
// @desc    Get products in a category
// @access  Public
router.get('/:id/products', [
  param('id').isMongoId().withMessage('Invalid category ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('includeDescendants').optional().isBoolean().withMessage('Include descendants must be boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20, includeDescendants = false } = req.query;
    const skip = (page - 1) * limit;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const Product = require('../models/Product');
    let query = {
      status: 'active',
      isActive: true
    };

    if (includeDescendants === 'true') {
      // Include products from this category and all its descendants
      const descendants = await category.getDescendants();
      const categoryIds = [category._id, ...descendants.map(d => d._id)];
      query.category = { $in: categoryIds };
    } else {
      // Only products directly in this category
      query.category = category._id;
    }

    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('exporter', 'firstName lastName businessInfo.companyName rating')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
      category: {
        id: category._id,
        name: category.name,
        slug: category.slug,
        path: category.path
      },
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get category products error:', error);
    res.status(500).json({ message: 'Server error while fetching category products' });
  }
});

module.exports = router;