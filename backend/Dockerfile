# Este Dockerfile espera un build context = raíz del repositorio, porque el
# backend necesita empaquetar también database/ (migraciones, seeds, queries).
#   docker build -f backend/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci
COPY backend/tsconfig.json ./
COPY backend/src ./src
RUN npm run build

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app

# Scripts de base de datos (migrate/seed), con sus propias dependencias.
COPY database/package.json database/package-lock.json* ./database/
RUN cd database && npm ci --omit=dev
COPY database/ ./database/

# Backend compilado.
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci --omit=dev
COPY --from=build /app/backend/dist ./dist
COPY backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
