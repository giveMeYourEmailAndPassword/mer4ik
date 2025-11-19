#!/bin/bash

echo "🧹 Очистка проекта..."

# Удаляем node_modules и package-lock
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Очищаем кэш npm
npm cache clean --force

echo "📦 Установка зависимостей..."

# Устанавливаем зависимости
npm install

echo "🚀 Запуск dev сервера..."

# Запускаем dev сервер
npm run dev