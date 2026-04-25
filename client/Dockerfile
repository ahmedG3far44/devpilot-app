# Builder stage
FROM node:22-alpine AS builder

WORKDIR /client

COPY client/package*.json ./

RUN npm ci

COPY client/ . 


RUN npm run build

RUN rm -fr /usr/share/nginx/html/*


FROM nginx:alpine

COPY --from=builder /client/dist /usr/share/nginx/html

COPY client/client.conf /etc/nginx/conf.d/client.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]