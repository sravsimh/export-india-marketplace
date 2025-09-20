const express = require('express');
const multer = require('multer');
const { body, query, param, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { auth, exporterOnly, verifiedOnly, ownerOrAdmin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads (images, documents)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and documents
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// @route   GET /api/products
// @desc    Get all products with filtering and pagination
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('category').optional().isMongoId().withMessage('Invalid category ID'),
  query('minPrice').optional().isFloat({ min: 0 }).withMessage('Min price must be positive'),
  query('maxPrice').optional().isFloat({ min: 0 }).withMessage('Max price must be positive'),
  query('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
  query('availability').optional().isIn(['available', 'limited', 'out_of_stock']).withMessage('Invalid availability status'),
  query('sortBy').optional().isIn(['name', 'price', 'rating', 'views', 'createdAt']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 20,
      search,
      category,
      minPrice,
      maxPrice,
      rating,
      availability,
      origin,
      exporter,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {
      status: 'active',
      isActive: true
    };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice) query['pricing.basePrice'].$gte = parseFloat(minPrice);
      if (maxPrice) query['pricing.basePrice'].$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (rating) {
      query['rating.average'] = { $gte: parseFloat(rating) };
    }

    // Availability filter
    if (availability) {
      query['availability.status'] = availability;
    }

    // Origin filter
    if (origin) {
      query['origin.country'] = new RegExp(origin, 'i');
    }

    // Exporter filter
    if (exporter) {
      query.exporter = exporter;
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // If searching by text, sort by score first
    if (search) {
      sortOptions.score = { $meta: 'textScore' };
    }

    const skip = (page - 1) * limit;

    // Execute query
    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .populate('exporter', 'firstName lastName businessInfo.companyName rating')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Product.countDocuments(query)
    ]);

    // Pagination info
    const totalPages = Math.ceil(totalProducts / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalProducts,
        hasNextPage,
        hasPrevPage,
        limit: parseInt(limit)
      },
      filters: {
        search,
        category,
        minPrice,
        maxPrice,
        rating,
        availability,
        origin,
        exporter
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', [
  param('id').isMongoId().withMessage('Invalid product ID')
], optionalAuth, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug path')
      .populate('exporter', 'firstName lastName businessInfo rating addresses socialMedia')
      .populate('reviews', 'rating comment user createdAt', null, { limit: 5, sort: { createdAt: -1 } });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if product is active (unless it's the owner viewing)
    if (product.status !== 'active' && (!req.user || req.user._id.toString() !== product.exporter._id.toString())) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment view count (only if not the owner)
    if (!req.user || req.user._id.toString() !== product.exporter._id.toString()) {
      await product.incrementViews();
    }

    // Get related products
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      status: 'active',
      isActive: true
    })
    .limit(4)
    .select('name pricing.basePrice pricing.currency pricing.priceUnit images rating')
    .populate('exporter', 'firstName lastName businessInfo.companyName');

    res.json({
      product,
      relatedProducts
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ message: 'Server error while fetching product' });
  }
});

// @route   POST /api/products
// @desc    Create new product
// @access  Private (Exporter only)
router.post('/', auth, exporterOnly, verifiedOnly, [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Product description is required'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('pricing.basePrice').isFloat({ min: 0 }).withMessage('Base price must be positive'),
  body('pricing.currency').isIn(['USD', 'EUR', 'INR', 'GBP', 'AUD', 'CAD']).withMessage('Invalid currency'),
  body('pricing.minOrderQuantity.value').isInt({ min: 1 }).withMessage('Min order quantity must be positive'),
  body('pricing.minOrderQuantity.unit').notEmpty().withMessage('Min order quantity unit is required'),
  body('origin.country').notEmpty().withMessage('Origin country is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify category exists
    const category = await Category.findById(req.body.category);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    const productData = {
      ...req.body,
      exporter: req.user._id,
      exporterInfo: {
        companyName: req.user.businessInfo?.companyName || `${req.user.firstName} ${req.user.lastName}`,
        contactPerson: `${req.user.firstName} ${req.user.lastName}`,
        location: req.user.addresses?.[0] ? 
          `${req.user.addresses[0].city}, ${req.user.addresses[0].state}, ${req.user.addresses[0].country}` : 
          'India'
      }
    };

    const product = new Product(productData);
    await product.save();

    // Populate the response
    await product.populate('category', 'name slug');
    await product.populate('exporter', 'firstName lastName businessInfo.companyName');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (Owner or Admin)
router.put('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Product description cannot be empty'),
  body('category').optional().isMongoId().withMessage('Invalid category ID'),
  body('pricing.basePrice').optional().isFloat({ min: 0 }).withMessage('Base price must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.exporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Verify category if provided
    if (req.body.category) {
      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }

    // Update product
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        product[key] = req.body[key];
      }
    });

    await product.save();

    // Populate the response
    await product.populate('category', 'name slug');
    await product.populate('exporter', 'firstName lastName businessInfo.companyName');

    res.json({
      message: 'Product updated successfully',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (Owner or Admin)
router.delete('/:id', auth, [
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.exporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
});

// @route   POST /api/products/:id/images
// @desc    Upload product images
// @access  Private (Owner or Admin)
router.post('/:id/images', auth, upload.array('images', 10), [
  param('id').isMongoId().withMessage('Invalid product ID')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check ownership
    if (req.user.role !== 'admin' && product.exporter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }

    // In a real application, you would upload to Cloudinary or AWS S3
    // For now, we'll simulate the upload process
    const uploadedImages = req.files.map((file, index) => ({
      url: `/uploads/products/${product._id}/${Date.now()}-${index}-${file.originalname}`,
      alt: `${product.name} image ${index + 1}`,
      isPrimary: product.images.length === 0 && index === 0, // First image of first upload is primary
      cloudinaryId: `product_${product._id}_${Date.now()}_${index}`
    }));

    product.images.push(...uploadedImages);
    await product.save();

    res.json({
      message: 'Images uploaded successfully',
      images: uploadedImages
    });

  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'Server error while uploading images' });
  }
});

// @route   GET /api/products/search/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/search/suggestions', [
  query('q').notEmpty().withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q, limit = 5 } = req.query;
    
    // Get product name suggestions
    const productSuggestions = await Product.aggregate([
      {
        $match: {
          status: 'active',
          isActive: true,
          name: new RegExp(q, 'i')
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          _id: 1
        }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Get category suggestions
    const categorySuggestions = await Category.find({
      name: new RegExp(q, 'i'),
      isActive: true,
      isVisible: true
    })
    .select('name slug')
    .limit(parseInt(limit));

    res.json({
      products: productSuggestions,
      categories: categorySuggestions
    });

  } catch (error) {
    console.error('Search suggestions error:', error);
    res.status(500).json({ message: 'Server error while fetching suggestions' });
  }
});

// @route   GET /api/products/exporter/:exporterId
// @desc    Get products by exporter
// @access  Public
router.get('/exporter/:exporterId', [
  param('exporterId').isMongoId().withMessage('Invalid exporter ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      exporter: req.params.exporterId,
      status: 'active',
      isActive: true
    };

    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-__v'),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    res.json({
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
    console.error('Get exporter products error:', error);
    res.status(500).json({ message: 'Server error while fetching exporter products' });
  }
});

// @route   POST /api/products/:id/inquiry
// @desc    Send inquiry for a product
// @access  Private
router.post('/:id/inquiry', auth, [
  param('id').isMongoId().withMessage('Invalid product ID'),
  body('message').notEmpty().withMessage('Inquiry message is required'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product = await Product.findById(req.params.id)
      .populate('exporter', 'email firstName lastName businessInfo');

    if (!product || product.status !== 'active') {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Can't inquire about own product
    if (product.exporter._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'Cannot inquire about your own product' });
    }

    // Increment inquiry count
    await product.incrementInquiries();

    // In a real application, you would:
    // 1. Save the inquiry to database
    // 2. Send email to exporter
    // 3. Send notification

    res.json({
      message: 'Inquiry sent successfully',
      inquiry: {
        product: product.name,
        exporter: product.exporter.businessInfo?.companyName || `${product.exporter.firstName} ${product.exporter.lastName}`,
        message: req.body.message,
        quantity: req.body.quantity,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Send inquiry error:', error);
    res.status(500).json({ message: 'Server error while sending inquiry' });
  }
});

module.exports = router;