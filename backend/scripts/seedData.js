const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// Import models
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

// Sample data
const categories = [
  {
    name: 'Textiles & Garments',
    description: 'High-quality textiles, fabrics, and ready-made garments from India',
    hsCodePrefixes: ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63'],
    isFeatured: true,
    showOnHomepage: true,
    displayOrder: 1
  },
  {
    name: 'Spices & Food Products',
    description: 'Authentic Indian spices, tea, coffee, rice, and processed food items',
    hsCodePrefixes: ['07', '08', '09', '10', '11', '12', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24'],
    isFeatured: true,
    showOnHomepage: true,
    displayOrder: 2
  },
  {
    name: 'Handicrafts & Art',
    description: 'Traditional Indian handicrafts, artwork, and decorative items',
    hsCodePrefixes: ['66', '67', '96'],
    isFeatured: true,
    showOnHomepage: true,
    displayOrder: 3
  },
  {
    name: 'Pharmaceuticals',
    description: 'Generic medicines, APIs, and healthcare products',
    hsCodePrefixes: ['29', '30'],
    isFeatured: true,
    showOnHomepage: true,
    displayOrder: 4
  },
  {
    name: 'Chemicals',
    description: 'Organic and inorganic chemicals, petrochemicals, and specialty chemicals',
    hsCodePrefixes: ['28', '29', '32', '33', '34', '35', '36', '37', '38'],
    isFeatured: true,
    showOnHomepage: true,
    displayOrder: 5
  },
  {
    name: 'Engineering Goods',
    description: 'Machinery, tools, auto parts, and engineering equipment',
    hsCodePrefixes: ['72', '73', '74', '75', '76', '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90'],
    isFeatured: true,
    showOnHomepage: true,
    displayOrder: 6
  },
  {
    name: 'Jewelry & Gems',
    description: 'Precious stones, jewelry, and ornamental items',
    hsCodePrefixes: ['71'],
    isFeatured: true,
    showOnHomepage: true,
    displayOrder: 7
  },
  {
    name: 'Leather Products',
    description: 'Leather goods, footwear, and accessories',
    hsCodePrefixes: ['41', '42', '43', '64'],
    isFeatured: true,
    showOnHomepage: true,
    displayOrder: 8
  }
];

const users = [
  {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin@exportindia.com',
    password: 'admin123',
    phone: '+919876543210',
    role: 'admin',
    isVerified: true,
    status: 'active'
  },
  {
    firstName: 'Rajesh',
    lastName: 'Kumar',
    email: 'rajesh@textileexports.com',
    password: 'password123',
    phone: '+919876543211',
    role: 'exporter',
    isVerified: true,
    status: 'active',
    businessInfo: {
      companyName: 'Kumar Textile Exports',
      businessType: 'manufacturer',
      establishedYear: 2010,
      employeeCount: '51-200',
      annualTurnover: '$1-5 Million',
      gstNumber: '07AABCU9603R1ZM',
      ieCode: 'AABCU9603R',
      panNumber: 'AABCU9603R',
      exportLicense: 'EL123456789'
    },
    addresses: [{
      type: 'registered',
      street: '123 Industrial Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      pincode: '400001',
      isDefault: true
    }],
    exportData: {
      totalExports: 150,
      totalValue: 2500000,
      mainMarkets: ['USA', 'UK', 'Germany', 'Australia'],
      paymentMethods: ['LC', 'TT'],
      minimumOrderValue: 10000
    },
    socialMedia: {
      website: 'https://kumartextile.com',
      linkedin: 'https://linkedin.com/company/kumar-textile'
    }
  },
  {
    firstName: 'Priya',
    lastName: 'Sharma',
    email: 'priya@spiceworld.in',
    password: 'password123',
    phone: '+919876543212',
    role: 'exporter',
    isVerified: true,
    status: 'active',
    businessInfo: {
      companyName: 'Spice World Exports',
      businessType: 'trader',
      establishedYear: 2015,
      employeeCount: '11-50',
      annualTurnover: '$500K-1M',
      gstNumber: '19AABCS1234E1ZM',
      ieCode: 'AABCS1234E',
      panNumber: 'AABCS1234E',
      exportLicense: 'EL987654321'
    },
    addresses: [{
      type: 'registered',
      street: '456 Spice Market',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      pincode: '110001',
      isDefault: true
    }],
    exportData: {
      totalExports: 89,
      totalValue: 850000,
      mainMarkets: ['Middle East', 'Europe', 'USA'],
      paymentMethods: ['TT', 'DA'],
      minimumOrderValue: 5000
    },
    socialMedia: {
      website: 'https://spiceworld.in'
    }
  },
  {
    firstName: 'John',
    lastName: 'Smith',
    email: 'john@globaltrade.com',
    password: 'password123',
    phone: '+1234567890',
    role: 'buyer',
    isVerified: true,
    status: 'active',
    addresses: [{
      type: 'billing',
      street: '789 Business St',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      pincode: '10001',
      isDefault: true
    }]
  }
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/export-india', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedCategories = async () => {
  try {
    await Category.deleteMany({});
    console.log('Existing categories cleared');

    const createdCategories = await Category.insertMany(categories);
    console.log(`${createdCategories.length} categories created successfully`);

    return createdCategories;
  } catch (error) {
    console.error('Error seeding categories:', error);
    throw error;
  }
};

const seedUsers = async () => {
  try {
    await User.deleteMany({});
    console.log('Existing users cleared');

    // Hash passwords
    for (let user of users) {
      const salt = await bcrypt.genSalt(12);
      user.password = await bcrypt.hash(user.password, salt);
    }

    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created successfully`);

    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

const seedProducts = async (categories, users) => {
  try {
    await Product.deleteMany({});
    console.log('Existing products cleared');

    const exporters = users.filter(user => user.role === 'exporter');
    const textileCategory = categories.find(cat => cat.name === 'Textiles & Garments');
    const spiceCategory = categories.find(cat => cat.name === 'Spices & Food Products');

    const products = [
      {
        name: 'Premium Cotton Fabric',
        description: 'High-quality 100% organic cotton fabric perfect for garment manufacturing. Breathable, durable, and eco-friendly.',
        shortDescription: 'Premium organic cotton fabric for garments',
        exporter: exporters[0]._id,
        exporterInfo: {
          companyName: exporters[0].businessInfo.companyName,
          contactPerson: `${exporters[0].firstName} ${exporters[0].lastName}`,
          location: 'Mumbai, Maharashtra, India'
        },
        category: textileCategory._id,
        hsCode: '520100',
        tags: ['cotton', 'fabric', 'organic', 'textile'],
        pricing: {
          basePrice: 5.50,
          currency: 'USD',
          priceUnit: 'per meter',
          minOrderQuantity: {
            value: 1000,
            unit: 'meters'
          }
        },
        images: [{
          url: '/images/products/cotton-fabric.jpg',
          alt: 'Premium Cotton Fabric',
          isPrimary: true,
          cloudinaryId: 'cotton_fabric_001'
        }],
        specifications: [
          { name: 'Material', value: '100% Organic Cotton' },
          { name: 'Weight', value: '150 GSM' },
          { name: 'Width', value: '58 inches' },
          { name: 'Color', value: 'Natural White' }
        ],
        availability: {
          status: 'available',
          stockQuantity: 50000,
          leadTime: { min: 15, max: 30, unit: 'days' },
          productionCapacity: { quantity: 100000, period: 'monthly' }
        },
        shipping: {
          weight: { value: 0.15, unit: 'kg' },
          dimensions: { length: 100, width: 58, height: 0.1, unit: 'cm' }
        },
        qualityStandards: ['GOTS', 'OEKO-TEX'],
        paymentTerms: ['LC', 'TT'],
        origin: { country: 'India', state: 'Maharashtra', city: 'Mumbai' },
        status: 'active',
        isActive: true,
        isFeatured: true,
        publishedAt: new Date()
      },
      {
        name: 'Indian Basmati Rice',
        description: 'Premium aged Indian Basmati rice with long grains and aromatic fragrance. Perfect for international markets.',
        shortDescription: 'Premium aged Basmati rice with aromatic fragrance',
        exporter: exporters[1]._id,
        exporterInfo: {
          companyName: exporters[1].businessInfo.companyName,
          contactPerson: `${exporters[1].firstName} ${exporters[1].lastName}`,
          location: 'Delhi, India'
        },
        category: spiceCategory._id,
        hsCode: '100630',
        tags: ['basmati', 'rice', 'premium', 'aromatic'],
        pricing: {
          basePrice: 1200,
          currency: 'USD',
          priceUnit: 'per ton',
          minOrderQuantity: {
            value: 25,
            unit: 'tons'
          }
        },
        images: [{
          url: '/images/products/basmati-rice.jpg',
          alt: 'Indian Basmati Rice',
          isPrimary: true,
          cloudinaryId: 'basmati_rice_001'
        }],
        specifications: [
          { name: 'Variety', value: 'Basmati 1121' },
          { name: 'Aging', value: '2 Years' },
          { name: 'Average Length', value: '8.30mm' },
          { name: 'Moisture', value: 'Max 12%' },
          { name: 'Broken Grains', value: 'Max 2%' }
        ],
        availability: {
          status: 'available',
          stockQuantity: 500,
          leadTime: { min: 20, max: 45, unit: 'days' },
          productionCapacity: { quantity: 1000, period: 'monthly' }
        },
        shipping: {
          weight: { value: 1000, unit: 'kg' },
          packaging: {
            type: '50kg bags',
            description: 'Food-grade packaging with moisture protection'
          }
        },
        qualityStandards: ['FSSAI', 'ISO 22000'],
        certifications: [{
          name: 'FSSAI License',
          issuingBody: 'Food Safety and Standards Authority of India',
          validUntil: new Date('2025-12-31')
        }],
        paymentTerms: ['LC', 'TT'],
        origin: { country: 'India', state: 'Punjab', city: 'Amritsar' },
        status: 'active',
        isActive: true,
        isFeatured: true,
        publishedAt: new Date()
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} products created successfully`);

    return createdProducts;
  } catch (error) {
    console.error('Error seeding products:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    await connectDB();

    const createdCategories = await seedCategories();
    console.log('✅ Categories seeded successfully\n');

    const createdUsers = await seedUsers();
    console.log('✅ Users seeded successfully\n');

    const createdProducts = await seedProducts(createdCategories, createdUsers);
    console.log('✅ Products seeded successfully\n');

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Categories: ${createdCategories.length}`);
    console.log(`- Users: ${createdUsers.length}`);
    console.log(`- Products: ${createdProducts.length}`);
    
    console.log('\n👤 Test Accounts:');
    console.log('Admin: admin@exportindia.com / admin123');
    console.log('Exporter: rajesh@textileexports.com / password123');
    console.log('Buyer: john@globaltrade.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  seedDatabase,
  seedCategories,
  seedUsers,
  seedProducts
};