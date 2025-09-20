const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxLength: 50
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxLength: 50
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minLength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['buyer', 'exporter', 'admin'],
    default: 'buyer'
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number']
  },
  avatar: {
    type: String,
    default: ''
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Business Information (for exporters)
  businessInfo: {
    companyName: String,
    businessType: {
      type: String,
      enum: ['manufacturer', 'trader', 'supplier', 'distributor', 'agent']
    },
    establishedYear: Number,
    employeeCount: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '500+']
    },
    annualTurnover: String,
    gstNumber: String,
    ieCode: String, // Import Export Code
    panNumber: String,
    businessLicense: String,
    certifications: [String],
    exportLicense: String
  },
  
  // Address Information
  addresses: [{
    type: {
      type: String,
      enum: ['billing', 'shipping', 'registered'],
      required: true
    },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    pincode: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  
  // Rating and Reviews
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 }
  },
  
  // Export Specific Data
  exportData: {
    totalExports: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    mainMarkets: [String],
    exportCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    paymentMethods: [{
      type: String,
      enum: ['LC', 'TT', 'DA', 'DP', 'CAD', 'Others']
    }],
    minimumOrderValue: Number
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'pending'],
    default: 'pending'
  },
  
  // Social Media and Website
  socialMedia: {
    website: String,
    linkedin: String,
    facebook: String,
    twitter: String
  },
  
  // Settings
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    privacy: {
      showEmail: { type: Boolean, default: false },
      showPhone: { type: Boolean, default: true }
    }
  },
  
  lastLogin: Date,
  loginCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'businessInfo.gstNumber': 1 });
userSchema.index({ 'businessInfo.ieCode': 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate verification token
userSchema.methods.generateVerificationToken = function() {
  return require('crypto').randomBytes(32).toString('hex');
};

module.exports = mongoose.model('User', userSchema);