# ---- Frontend: multi-stage build (React) served by Nginx ----

# Stage 1: build the static assets
FROM node:20-alpine AS build

WORKDIR /app

# REACT_APP_BACKEND_URL is baked at build time. For the same-origin Nginx setup
# we leave it empty so the app calls "/api" (proxied by Nginx to the backend).
ARG REACT_APP_BACKEND_URL=""
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
ENV NODE_OPTIONS=--max-old-space-size=4096
ENV DISABLE_ESLINT_PLUGIN=true
ENV GENERATE_SOURCEMAP=false
ENV CI=false

# Install deps (leverage layer caching).
# yarn.lock is optional (the trailing * keeps the build working even if the
# lockfile wasn't committed/cloned). When present it is used for reproducible installs.
COPY package.json yarn.lock* ./
RUN yarn install --network-timeout 600000

# Build
COPY . .
RUN yarn build

# Stage 2: serve with Nginx
FROM nginx:1.27-alpine

RUN apk add --no-cache curl

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=5 \
    CMD curl -fsS http://localhost:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
