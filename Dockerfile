FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:api

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4100 DATABASE_PATH=/app/data/atlas.sqlite
COPY package*.json ./
RUN npm ci --omit=dev && mkdir -p /app/data && chown node:node /app/data
COPY --from=build /app/dist ./dist
COPY server ./server
COPY shared ./shared
USER node
EXPOSE 4100
VOLUME /app/data
CMD ["npm", "start"]
