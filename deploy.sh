#!/bin/bash
set -euo pipefail

echo "PIUS Frontend - Deploy"
echo "======================"

cd "$(dirname "$0")"

echo "Pull latest code..."
git pull origin main

echo "Ensure production API URL..."
echo "VITE_API_URL=https://api.prijava.pius-academy.com/api" > .env.production

echo "Install dependencies if needed..."
if [ ! -d node_modules ]; then
  npm install
fi

echo "Build production bundle..."
rm -rf dist
npm run build

echo "Frontend deploy complete."
echo "Build output: $(pwd)/dist"
echo "Site: https://prijava.pius-academy.com/admin/login"
