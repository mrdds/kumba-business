#!/bin/sh

# Wait for DB (optional, better handled by healthchecks in compose)
# ./wait-for-it.sh db:5432

# Run migrations
python manage.py migrate

# Collect static files
python manage.py collectstatic --noinput

# Start server
exec "$@"
