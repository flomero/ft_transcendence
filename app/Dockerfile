FROM node:22

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build:ts

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["npm", "start"] 