# DevIntervue — single production image.
# Stage 1 builds the React frontend; stage 2 runs the Express backend,
# which serves frontend/dist itself when NODE_ENV=production (see
# backend/src/server.js). One container = one Render/Railway/Fly service.
#
# Build-time args (Vite bakes these into the bundle):
#   VITE_CLERK_PUBLISHABLE_KEY, VITE_STREAM_API_KEY
# Runtime env (see backend/.env.example):
#   DB_URL, CLERK_SECRET_KEY, STREAM_API_KEY, STREAM_API_SECRET, ...

# ---------- stage 1: frontend build ----------
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ARG VITE_CLERK_PUBLISHABLE_KEY=""
ARG VITE_STREAM_API_KEY=""
ENV VITE_CLERK_PUBLISHABLE_KEY=${VITE_CLERK_PUBLISHABLE_KEY} \
    VITE_STREAM_API_KEY=${VITE_STREAM_API_KEY}
RUN npm run build

# ---------- stage 2: backend runtime ----------
FROM node:20-alpine
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund
COPY backend/src ./src
# server.js resolves frontend/dist as ../frontend/dist relative to cwd (/app/backend)
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/server.js"]
