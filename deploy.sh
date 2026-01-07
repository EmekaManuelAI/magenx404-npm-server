#!/bin/bash
set -e

echo "🚀 Deploying magenx404 to npm..."
echo ""

# Check if logged in
echo "📋 Checking npm login status..."
if ! npm whoami &> /dev/null; then
  echo "❌ Not logged in to npm. Please run: npm login"
  exit 1
fi

echo "✅ Logged in as: $(npm whoami)"
echo ""

# Install dependencies if needed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.bin/vitest" ]; then
  echo "📥 Installing dependencies..."
  npm install
fi
echo ""

# Run tests
echo "🧪 Running tests..."
if npm test; then
  echo "✅ All tests passed!"
else
  echo "⚠️  Tests failed or skipped."
  read -p "Continue with deployment anyway? (y/N) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
  fi
fi
echo ""

# Check what will be published
echo "📦 Checking what will be published..."
npm pack --dry-run
echo ""

# Show current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📝 Current version: $CURRENT_VERSION"
echo ""

# Check if version exists on npm
PUBLISHED_VERSION=$(npm view magenx404 version 2>/dev/null || echo "not-found")
if [ "$PUBLISHED_VERSION" != "not-found" ]; then
  echo "📦 Latest published version: $PUBLISHED_VERSION"
  if [ "$CURRENT_VERSION" == "$PUBLISHED_VERSION" ]; then
    echo "⚠️  Version $CURRENT_VERSION already exists on npm!"
    echo "   Please update the version in package.json first."
    exit 1
  fi
fi
echo ""

# Confirm before publishing
read -p "🚀 Ready to publish version $CURRENT_VERSION? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Deployment cancelled."
  exit 1
fi

# Publish
echo "📤 Publishing to npm..."
if npm publish; then
  echo ""
  echo "✅ Successfully published magenx404@$CURRENT_VERSION!"
  echo "📦 View on npm: https://www.npmjs.com/package/magenx404"
  echo ""
  echo "🎉 Deployment complete!"
else
  echo ""
  echo "❌ Publishing failed. Check the error above."
  exit 1
fi

