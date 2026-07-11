# check=skip=SecretsUsedInArgOrEnv
# The VITE_* keys are intentionally inlined into the client bundle (free-tier,
# localhost-scoped keys); a production build would proxy them server-side. That
# documented trade-off is why the SecretsUsedInArgOrEnv build check is skipped.

# ---- Build stage ----
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies first so this layer is cached across source-only changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite inlines VITE_* variables at build time, so keys arrive as build args.
# See README ("Build-time API keys") for the trade-offs of this approach.
ARG VITE_NEWSAPI_API_KEY
ARG VITE_GUARDIAN_API_KEY
ARG VITE_NYT_API_KEY
ARG VITE_PUB_NEWSDATA_API_KEY
ENV VITE_NEWSAPI_API_KEY=$VITE_NEWSAPI_API_KEY \
    VITE_GUARDIAN_API_KEY=$VITE_GUARDIAN_API_KEY \
    VITE_NYT_API_KEY=$VITE_NYT_API_KEY
ENV VITE_PUB_NEWSDATA_API_KEY=$VITE_PUB_NEWSDATA_API_KEY

RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine AS serve

# Replace the default site with our SPA-aware, gzip + security-header config.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Report unhealthy if nginx stops serving the app.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
