# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* variables at build time, so keys arrive as build args.
# See README for the trade-offs of this approach.
ARG VITE_NEWSAPI_API_KEY
ARG VITE_GUARDIAN_API_KEY
ARG VITE_NYT_API_KEY
ENV VITE_NEWSAPI_API_KEY=$VITE_NEWSAPI_API_KEY \
    VITE_GUARDIAN_API_KEY=$VITE_GUARDIAN_API_KEY \
    VITE_NYT_API_KEY=$VITE_NYT_API_KEY

RUN npm run build

# ---- Serve stage ----
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
