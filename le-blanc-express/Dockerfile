FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build:elegant
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "server/index.js"]
