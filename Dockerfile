# Production Dockerfile for KathaAI Multilingual Voice Intelligence Platform
FROM node:22-slim

# Install system dependencies including FFmpeg for 16kHz audio normalization and curl for health check
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency specifications
COPY package.json bun.lock* ./

# Install all dependencies
RUN npm install

# Copy application source
COPY . .

# Build production frontend assets
RUN npm run build

# Configure runtime environment
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start full-stack server
CMD ["npm", "start"]
