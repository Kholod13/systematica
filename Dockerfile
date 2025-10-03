# 1. Используем Node для сборки
FROM node:20-alpine AS build

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходники
COPY . .

# Собираем проект
RUN npm run build

# 2. Используем лёгкий сервер для отдачи готового билда
FROM node:20-alpine AS runtime

WORKDIR /app

# Устанавливаем serve
RUN npm install -g serve

# Копируем билд
COPY --from=build /app/dist ./dist

# Экспонируем порт Railway
EXPOSE 8080

# Команда запуска
CMD ["serve", "-s", "dist", "-l", "8080"]
