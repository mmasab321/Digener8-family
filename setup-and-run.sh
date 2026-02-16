#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Applying migrations (or use 'npx prisma db push' for fresh local DB)..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push

echo "Seeding database..."
npm run db:seed

echo "Starting dev server at http://localhost:3000"
npm run dev
