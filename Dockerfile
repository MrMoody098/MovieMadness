# Use the official Node.js image
FROM node:22-bookworm-slim

# Create and set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json from movie-man-view
COPY movie-man-view/package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code
COPY movie-man-view/ ./
COPY scripts/ /scripts/

# Expose the port the app will run on
EXPOSE 3000 3001

# Set environment variable to avoid watch issues in Docker
ENV CHOKIDAR_USEPOLLING=true

# Command to run the app
CMD ["npm", "start"]
