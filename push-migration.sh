#!/bin/bash

# Supabase Migration Push Script
# This script helps you push the payment system migration to Supabase

echo "🚀 Supabase Migration Push Helper"
echo "=================================="
echo ""
echo "Your Supabase Project: vnqgdftaxhflidnoksnv"
echo "Migration File: supabase/migrations/20250102_create_payment_system.sql"
echo ""
echo "Choose a method to push the migration:"
echo ""
echo "1. Open Supabase SQL Editor (Recommended)"
echo "2. Use Supabase CLI with access token"
echo "3. Use direct PostgreSQL connection"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    echo ""
    echo "Opening Supabase SQL Editor..."
    echo ""
    echo "Instructions:"
    echo "1. Copy the migration SQL from: supabase/migrations/20250102_create_payment_system.sql"
    echo "2. Paste it into the SQL Editor"
    echo "3. Click 'Run' to execute"
    echo ""
    open "https://supabase.com/dashboard/project/vnqgdftaxhflidnoksnv/sql/new"

    # Also copy the migration to clipboard if pbcopy is available
    if command -v pbcopy &> /dev/null; then
      cat supabase/migrations/20250102_create_payment_system.sql | pbcopy
      echo "✅ Migration SQL copied to clipboard!"
    fi
    ;;

  2)
    echo ""
    read -p "Enter your Supabase access token: " token
    read -p "Enter your database password: " password
    echo ""
    echo "Linking project..."
    npx supabase link --project-ref vnqgdftaxhflidnoksnv --password "$password"
    echo ""
    echo "Pushing migration..."
    SUPABASE_ACCESS_TOKEN="$token" npx supabase db push
    ;;

  3)
    echo ""
    read -p "Enter your database password: " password
    echo ""
    echo "Connecting to database and running migration..."
    PGPASSWORD="$password" psql "postgresql://postgres@db.vnqgdftaxhflidnoksnv.supabase.co:5432/postgres" -f supabase/migrations/20250102_create_payment_system.sql
    ;;

  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

echo ""
echo "✅ Done!"
