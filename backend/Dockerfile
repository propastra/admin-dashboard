# Stage 1: Build TypeScript
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /usr/src/app

# Only copy over package files and production dependencies
COPY package*.json ./
RUN npm install --only=production

# Copy compiled JS files from builder
COPY --from=builder /usr/src/app/dist ./dist

# Create uploads dir if it doesn't exist
RUN mkdir -p uploads

# Expose port
EXPOSE 5001

CMD ["node", "dist/server.js"]
