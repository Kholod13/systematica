# -----------------------
# 1. Сборка React
# -----------------------
FROM node:lts-alpine AS build

WORKDIR /app

# Копируем только package.json + lock
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходники
COPY . ./

# Собираем проект
RUN npm run build

# -----------------------
# 2. Caddy для сервинга
# -----------------------
FROM caddy:latest

WORKDIR /app

# Копируем Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Копируем билд React
COPY --from=build /app/dist /app/dist

# Запуск Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
