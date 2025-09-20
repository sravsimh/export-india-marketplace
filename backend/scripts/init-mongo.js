// MongoDB initialization script for Docker container
// This script runs when the MongoDB container starts for the first time

// Switch to the application database
db = db.getSiblingDB('export_india');

// Create application user with read/write permissions
db.createUser({
  user: 'appuser',
  pwd: 'apppassword',
  roles: [
    {
      role: 'readWrite',
      db: 'export_india'
    }
  ]
});

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'email', 'password', 'role'],
      properties: {
        name: { bsonType: 'string' },
        email: { bsonType: 'string' },
        password: { bsonType: 'string' },
        role: { 
          bsonType: 'string',
          enum: ['buyer', 'exporter', 'admin']
        }
      }
    }
  }
});

db.createCollection('categories', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'slug'],
      properties: {
        name: { bsonType: 'string' },
        slug: { bsonType: 'string' },
        parent: { bsonType: ['objectId', 'null'] }
      }
    }
  }
});

db.createCollection('products', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'description', 'exporter', 'category', 'pricing'],
      properties: {
        title: { bsonType: 'string' },
        description: { bsonType: 'string' },
        exporter: { bsonType: 'objectId' },
        category: { bsonType: 'objectId' },
        pricing: { bsonType: 'object' }
      }
    }
  }
});

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isVerified: 1 });

db.categories.createIndex({ slug: 1 }, { unique: true });
db.categories.createIndex({ parent: 1 });
db.categories.createIndex({ path: 1 });

db.products.createIndex({ exporter: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ status: 1 });
db.products.createIndex({ isActive: 1 });
db.products.createIndex({ 'pricing.price': 1 });
db.products.createIndex({ createdAt: -1 });

// Text indexes for search functionality
db.products.createIndex({ 
  title: 'text', 
  description: 'text',
  'specifications.value': 'text'
});

db.categories.createIndex({ 
  name: 'text', 
  description: 'text' 
});

db.users.createIndex({ 
  name: 'text',
  'businessProfile.companyName': 'text',
  'businessProfile.description': 'text'
});

print('✅ Database initialization completed successfully');
print('✅ Created collections: users, categories, products');
print('✅ Created indexes for performance optimization');
print('✅ Created text indexes for search functionality');