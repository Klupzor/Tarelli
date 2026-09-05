# Build context = raíz del repositorio para mantener consistencia con backend/Dockerfile:
#   docker build -f frontend/Dockerfile .

FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci
COPY frontend/ ./

# La URL de la API se hornea en el bundle en tiempo de build (SPA estática).
ARG VITE_API_BASE_URL=http://localhost:4000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
