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
ARG VITE_NEWSDATA_API_KEY
ENV VITE_NEWSAPI_API_KEY=$VITE_NEWSAPI_API_KEY \
    VITE_GUARDIAN_API_KEY=$VITE_GUARDIAN_API_KEY \
    VITE_NYT_API_KEY=$VITE_NYT_API_KEY
ENV VITE_NEWSDATA_API_KEY=$VITE_NEWSDATA_API_KEY

RUN npm run build

# ---- Serve stage ----
FROM nginx:1.27-alpine AS serve

# Replace the default site with our SPA-aware, gzip + security-header config.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

# Report unhealthy if nginx stops serving the app. Probe 127.0.0.1, not
# localhost: in the container localhost resolves to ::1 (IPv6) first, but
# nginx's `listen 80` binds IPv4 only, so a localhost probe is refused.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
