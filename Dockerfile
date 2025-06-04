# Use a production-grade Node.js image
FROM node:18-slim

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Set NODE_ENV to production
ENV NODE_ENV=production

# Expose the port the application will run on
EXPOSE 8080

# Health check for the application
# Assumes the server running on port 8080 will serve the /api/healthz Next.js API route
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8080/api/healthz || exit 1

# Command to run the application
# Note: For a production Next.js deployment, you might typically use `npm run build` (done before/during docker build)
# and then `npm run start` (which runs `next start`).
# The current CMD `genkit start` might be for development or a specific Genkit deployment model.
CMD ["genkit", "start", "--port=8080"]
