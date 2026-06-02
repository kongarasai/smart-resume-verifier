FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN mkdir -p uploads/resumes uploads/photos uploads/attachments
EXPOSE 5000
CMD ["node", "src/index.js"]
