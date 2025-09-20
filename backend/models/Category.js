const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxLength: 100
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxLength: 1000
  },
  
  // Hierarchy
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0
  },
  path: {
    type: String, // Stores the path like "electronics/mobile-phones"
    index: true
  },
  
  // Images and Media
  image: {
    url: String,
    alt: String,
    cloudinaryId: String
  },
  icon: {
    url: String,
    name: String // For icon fonts like FontAwesome
  },
  banner: {
    url: String,
    alt: String,
    cloudinaryId: String
  },
  
  // SEO
  seoTitle: String,
  seoDescription: String,
  keywords: [String],
  
  // Business Information
  hsCodePrefixes: [String], // Common HS code prefixes for this category
  specifications: [{
    name: String,
    type: { type: String, enum: ['text', 'number', 'select', 'multiselect'] },
    options: [String], // For select/multiselect types
    required: { type: Boolean, default: false }
  }],
  
  // Display and Ordering
  displayOrder: {
    type: Number,
    default: 0
  },
  color: String, // For UI theming
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  productCount: {
    type: Number,
    default: 0
  },
  
  // Features
  isFeatured: {
    type: Boolean,
    default: false
  },
  showOnHomepage: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ isActive: 1, isVisible: 1 });
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ name: 'text', description: 'text' });

// Pre-save middleware to generate slug and path
categorySchema.pre('save', async function(next) {
  try {
    // Generate slug if not provided
    if (!this.slug || this.isModified('name')) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single
        .trim('-'); // Remove leading/trailing hyphens
      
      // Ensure slug is unique
      const existingCategory = await this.constructor.findOne({ 
        slug: this.slug, 
        _id: { $ne: this._id } 
      });
      
      if (existingCategory) {
        this.slug = `${this.slug}-${Date.now()}`;
      }
    }
    
    // Set level and path based on parent
    if (this.parent) {
      const parentCategory = await this.constructor.findById(this.parent);
      if (parentCategory) {
        this.level = parentCategory.level + 1;
        this.path = parentCategory.path ? `${parentCategory.path}/${this.slug}` : this.slug;
      }
    } else {
      this.level = 0;
      this.path = this.slug;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Post-save middleware to update product count
categorySchema.post('save', async function() {
  await this.updateProductCount();
});

// Instance methods
categorySchema.methods.updateProductCount = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ category: this._id });
  
  if (this.productCount !== count) {
    await this.constructor.updateOne(
      { _id: this._id },
      { $set: { productCount: count } }
    );
  }
};

categorySchema.methods.getAncestors = async function() {
  if (!this.parent) return [];
  
  const ancestors = [];
  let current = await this.constructor.findById(this.parent);
  
  while (current) {
    ancestors.unshift(current);
    current = current.parent ? await this.constructor.findById(current.parent) : null;
  }
  
  return ancestors;
};

categorySchema.methods.getDescendants = async function() {
  const descendants = await this.constructor.find({
    path: new RegExp(`^${this.path}/`)
  }).sort({ path: 1 });
  
  return descendants;
};

categorySchema.methods.getChildren = async function() {
  const children = await this.constructor.find({ parent: this._id })
    .sort({ displayOrder: 1, name: 1 });
  
  return children;
};

categorySchema.methods.getSiblings = async function() {
  const siblings = await this.constructor.find({
    parent: this.parent,
    _id: { $ne: this._id }
  }).sort({ displayOrder: 1, name: 1 });
  
  return siblings;
};

// Static methods
categorySchema.statics.buildTree = async function(parentId = null, level = 0) {
  const categories = await this.find({ parent: parentId, isActive: true })
    .sort({ displayOrder: 1, name: 1 })
    .lean();
  
  for (let category of categories) {
    category.children = await this.buildTree(category._id, level + 1);
  }
  
  return categories;
};

categorySchema.statics.getAllActiveCategories = async function() {
  return await this.find({ isActive: true, isVisible: true })
    .sort({ level: 1, displayOrder: 1, name: 1 });
};

categorySchema.statics.getFeaturedCategories = async function(limit = 10) {
  return await this.find({ 
    isFeatured: true, 
    isActive: true, 
    isVisible: true 
  })
  .sort({ displayOrder: 1, name: 1 })
  .limit(limit);
};

categorySchema.statics.getHomepageCategories = async function() {
  return await this.find({ 
    showOnHomepage: true, 
    isActive: true, 
    isVisible: true 
  })
  .sort({ displayOrder: 1, name: 1 });
};

categorySchema.statics.searchCategories = async function(query, limit = 10) {
  return await this.find({
    $text: { $search: query },
    isActive: true,
    isVisible: true
  })
  .select('name slug description image level path')
  .limit(limit);
};

// Virtuals
categorySchema.virtual('breadcrumb').get(function() {
  if (!this.path) return [this];
  
  const parts = this.path.split('/');
  return parts.map((slug, index) => ({
    name: index === parts.length - 1 ? this.name : slug,
    slug: slug,
    path: parts.slice(0, index + 1).join('/')
  }));
});

categorySchema.virtual('fullName').get(function() {
  return this.path ? this.path.replace(/\//g, ' > ') : this.name;
});

// Ensure virtuals are serialized
categorySchema.set('toJSON', { virtuals: true });
categorySchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Category', categorySchema);