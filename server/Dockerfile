FROM node:22-alpine AS builder

WORKDIR /server

COPY server/package*.json .

COPY server/tsconfig*.json .

RUN npm ci

COPY server/ .

RUN npm run build


EXPOSE 5000



CMD ["npm", "start"]
