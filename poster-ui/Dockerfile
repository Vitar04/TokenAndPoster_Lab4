# Stage 1: build
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: run Next.js app
FROM node:20-alpine

WORKDIR /app
COPY --from=build /app ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
