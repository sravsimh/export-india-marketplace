# Use Node.js 18 Alpine image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --only=production

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci --only=production

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci --only=production

# Go back to root
WORKDIR /app

# Copy source code
COPY . .

# Build frontend for production
RUN cd frontend && npm run build

# Create uploads directory
RUN mkdir -p backend/uploads

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node backend/scripts/healthcheck.js || exit 1

# Start the application
CMD ["npm", "start"]