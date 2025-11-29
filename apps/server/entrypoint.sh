#!/bin/sh
set -e

if [ "$SEED" = "true" ]; then
  echo "Checking whether to run seed..."
  node dist/seed-if-empty.js || echo "Seed-if-empty script failed"
fi

echo "Starting server..."
node dist/index.js
