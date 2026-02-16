#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Pushing database schema..."
npx prisma db push

echo "Seeding database..."
npm run db:seed

echo "Starting dev server at http://localhost:3000"
npm run dev
