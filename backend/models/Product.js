const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxLength: 200
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxLength: 2000
  },
  shortDescription: {
    type: String,
    maxLength: 500
  },
  
  // Exporter Information
  exporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exporterInfo: {
    companyName: String,
    contactPerson: String,
    location: String
  },
  
  // Category and Classification
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Product category is required']
  },
  subCategory: String,
  hsCode: String, // Harmonized System Code
  tags: [String],
  
  // Pricing
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: 0
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'INR', 'GBP', 'AUD', 'CAD'],
      default: 'USD'
    },
    priceUnit: {
      type: String,
      enum: ['per piece', 'per kg', 'per ton', 'per meter', 'per liter', 'per dozen', 'per carton', 'per container'],
      default: 'per piece'
    },
    minOrderQuantity: {
      value: { type: Number, required: true, min: 1 },
      unit: { type: String, required: true }
    },
    bulkPricing: [{
      minQuantity: Number,
      maxQuantity: Number,
      price: Number,
      discount: Number // percentage
    }]
  },
  
  // Images and Media
  images: [{
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false },
    cloudinaryId: String
  }],
  videos: [{
    url: String,
    title: String,
    thumbnail: String,
    cloudinaryId: String
  }],
  documents: [{
    url: String,
    name: String,
    type: { type: String, enum: ['catalog', 'certificate', 'specification', 'other'] },
    size: Number,
    cloudinaryId: String
  }],
  
  // Product Specifications
  specifications: [{
    name: { type: String, required: true },
    value: { type: String, required: true },
    unit: String
  }],
  
  // Availability and Stock
  availability: {
    status: {
      type: String,
      enum: ['available', 'limited', 'out_of_stock', 'discontinued'],
      default: 'available'
    },
    stockQuantity: Number,
    leadTime: {
      min: Number,
      max: Number,
      unit: { type: String, enum: ['days', 'weeks', 'months'], default: 'days' }
    },
    productionCapacity: {
      quantity: Number,
      period: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] }
    }
  },
  
  // Shipping Information
  shipping: {
    weight: {
      value: Number,
      unit: { type: String, enum: ['kg', 'g', 'lbs', 'tons'], default: 'kg' }
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: ['cm', 'inches', 'm'], default: 'cm' }
    },
    packaging: {
      type: String,
      description: String,
      packagingCost: Number
    },
    shippingOptions: [{
      method: { type: String, enum: ['air', 'sea', 'road', 'rail'] },
      estimatedTime: String,
      cost: Number
    }]
  },
  
  // Quality and Certifications
  qualityStandards: [String],
  certifications: [{
    name: String,
    issuingBody: String,
    validUntil: Date,
    certificateUrl: String
  }],
  
  // Business Terms
  paymentTerms: [{
    type: String,
    enum: ['LC', 'TT', 'DA', 'DP', 'CAD', 'Others']
  }],
  supplyAbility: {
    quantity: Number,
    period: String
  },
  
  // SEO and Marketing
  seoTitle: String,
  seoDescription: String,
  keywords: [String],
  
  // Reviews and Ratings
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  reviews: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Review'
  }],
  
  // Analytics
  views: { type: Number, default: 0 },
  inquiries: { type: Number, default: 0 },
  orders: { type: Number, default: 0 },
  
  // Status and Flags
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'pending_approval', 'rejected'],
    default: 'draft'
  },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  isPromoted: { type: Boolean, default: false },
  
  // Location and Origin
  origin: {
    country: { type: String, required: true },
    state: String,
    city: String
  },
  
  // Timestamps and History
  publishedAt: Date,
  lastModified: { type: Date, default: Date.now },
  priceLastUpdated: Date
}, {
  timestamps: true
});

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ exporter: 1 });
productSchema.index({ 'pricing.basePrice': 1 });
productSchema.index({ 'rating.average': -1 });
productSchema.index({ views: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ hsCode: 1 });
productSchema.index({ isActive: 1, status: 1 });

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Update lastModified timestamp
  this.lastModified = new Date();
  
  // Set publishedAt when status changes to active
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Update priceLastUpdated when price is modified
  if (this.isModified('pricing.basePrice')) {
    this.priceLastUpdated = new Date();
  }
  
  // Ensure only one primary image
  if (this.isModified('images')) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        if (index > 0) img.isPrimary = false;
      });
    } else if (primaryImages.length === 0 && this.images.length > 0) {
      // Set first image as primary if none is marked
      this.images[0].isPrimary = true;
    }
  }
  
  next();
});

// Instance methods
productSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    { $match: { product: this._id } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.rating.average = Math.round(stats[0].avgRating * 10) / 10;
    this.rating.totalReviews = stats[0].totalReviews;
  } else {
    this.rating.average = 0;
    this.rating.totalReviews = 0;
  }

  return this.save();
};

productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

productSchema.methods.incrementInquiries = function() {
  this.inquiries += 1;
  return this.save();
};

productSchema.methods.incrementOrders = function() {
  this.orders += 1;
  return this.save();
};

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primaryImg = this.images.find(img => img.isPrimary);
  return primaryImg || (this.images.length > 0 ? this.images[0] : null);
});

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  const price = this.pricing.basePrice;
  const currency = this.pricing.currency;
  const unit = this.pricing.priceUnit;
  
  return `${currency} ${price.toLocaleString()} ${unit}`;
});

// Ensure virtuals are serialized
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);