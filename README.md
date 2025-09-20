# ExportIndia Marketplace

A comprehensive B2B marketplace platform connecting Indian exporters with global buyers. Built with Node.js, Express, MongoDB, and React.

## 🚀 Features

- **Multi-role System**: Support for Buyers, Exporters, and Admins
- **Product Management**: Comprehensive product catalog with categories, specifications, and pricing
- **Authentication & Authorization**: JWT-based secure authentication with role-based access
- **Search & Filtering**: Advanced product search with multiple filters
- **User Profiles**: Detailed business profiles for exporters with verification
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS
- **Email Integration**: Email verification, password reset, and notifications
- **File Upload**: Image and document upload capabilities
- **API Documentation**: RESTful APIs with validation and error handling

## 🛠 Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads
- **Nodemailer** - Email service
- **Express Validator** - Input validation

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Tailwind CSS** - Styling
- **Heroicons** - Icons
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications

## 📁 Project Structure

```
export-india-marketplace/
├── backend/
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   ├── scripts/          # Database scripts
│   └── server.js         # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   ├── pages/        # Page components
│   │   └── App.js        # Main app component
│   └── public/           # Static assets
└── package.json          # Root package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd export-india-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Configuration**
   
   Copy the example environment file in the backend:
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/export-india
   JWT_SECRET=your-super-secret-jwt-key
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed the Database (Optional)**
   ```bash
   cd backend
   npm run seed
   ```

6. **Start the Application**
   
   Development mode (runs both backend and frontend):
   ```bash
   npm run dev
   ```
   
   Or start separately:
   ```bash
   # Backend (from root)
   npm run server:dev
   
   # Frontend (from root)
   npm run client:dev
   ```

7. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 🔐 Test Accounts

After running the seed script, you can use these test accounts:

- **Admin**: admin@exportindia.com / admin123
- **Exporter**: rajesh@textileexports.com / password123
- **Buyer**: john@globaltrade.com / password123

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Products
- `GET /api/products` - Get all products (with filtering)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (Exporter only)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (Admin only)

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users` - Get all users (Admin only)

## 🚀 Deployment

### Production Build

1. **Build Frontend**
   ```bash
   npm run build
   ```

2. **Set Environment Variables**
   Update your production `.env` file with production values:
   ```env
   NODE_ENV=production
   MONGODB_URI=your-production-mongodb-uri
   JWT_SECRET=your-production-jwt-secret
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Docker Deployment (Optional)

Create a `Dockerfile` in the root directory:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm run install:all

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
```

Build and run with Docker:
```bash
docker build -t export-india-marketplace .
docker run -p 5000:5000 export-india-marketplace
```

## 🔧 Configuration

### Database Configuration
The application uses MongoDB. Update the `MONGODB_URI` in your `.env` file:
```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/export-india

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/export-india
```

### Email Configuration
Configure SMTP settings for email functionality:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=ExportIndia <noreply@exportindia.com>
```

## 📝 Scripts

- `npm run dev` - Start both backend and frontend in development mode
- `npm run server:dev` - Start backend in development mode
- `npm run client:dev` - Start frontend in development mode
- `npm run build` - Build frontend for production
- `npm start` - Start backend in production mode
- `npm run seed` - Seed database with sample data

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@exportindia.com or create an issue in the repository.

## 🔮 Future Enhancements

- [ ] Real-time chat system
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Payment gateway integration
- [ ] Advanced search with Elasticsearch
- [ ] Export documentation generation
- [ ] Logistics integration
- [ ] Video product galleries
- [ ] AI-powered product recommendations

---

Made with ❤️ for connecting Indian exporters with global buyers.