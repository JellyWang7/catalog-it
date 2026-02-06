#!/bin/bash

# CatalogIt Rails Server Startup Script
echo "🚀 Starting CatalogIt Rails Server..."
echo "Server will be available at: http://localhost:3000"
echo "Press Ctrl+C to stop"
echo ""

# Start Puma server directly (bypasses rails command issues)
bundle exec puma -C config/puma.rb
