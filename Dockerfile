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

# Command to run the application
CMD ["genkit", "start", "--port=8080"]
