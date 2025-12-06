# NPM Deployment Guide

Complete guide for deploying magenx404 to npm.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Version number updated
- [ ] README.md is up to date
- [ ] TypeScript types are correct
- [ ] No console.log statements in production code (optional)
- [ ] All features tested manually

## Step-by-Step Deployment

### 1. Verify You're Logged In

```bash
npm whoami
```

If not logged in:

```bash
npm login
```

### 2. Check Current Version on npm

```bash
npm view magenx404 version
```

This shows the latest published version.

### 3. Update Version Number

Since we've made significant changes (TypeScript conversion, wallet modal), bump the version:

```bash
# For patch updates (bug fixes, small features)
npm version patch

# For minor updates (new features, backward compatible)
npm version minor

# For major updates (breaking changes)
npm version major
```

**Recommended for this release:** `npm version minor` (since we added wallet modal feature)

This will:

- Update `package.json` version
- Create a git tag
- Commit the changes

### 4. Run Tests

```bash
npm test
```

Ensure all tests pass before publishing.

### 5. Verify What Will Be Published

```bash
npm pack --dry-run
```

This shows exactly what files will be included in the package. Should include:

- `src/` directory (all TypeScript source files)
- `index.ts` (main entry point)
- `tsconfig.json` (TypeScript config)
- `README.md` (documentation)
- `package.json` (metadata)

**Note:** `server/` and `tests/` are correctly excluded.

### 6. Test Package Locally (Optional but Recommended)

```bash
# Create tarball
npm pack

# This creates: magenx404-<version>.tgz
# Test it in a separate project
cd /path/to/test-project
npm install /path/to/magenx404/magenx404-<version>.tgz
```

### 7. Publish to npm

```bash
npm publish
```

If you have 2FA enabled, you'll need to provide an OTP:

```bash
npm publish --otp=<your-otp-code>
```

### 8. Verify Publication

1. Check on npm: https://www.npmjs.com/package/magenx404
2. Install and test in a fresh project:
   ```bash
   npm install magenx404
   ```

## Publishing TypeScript Source Files

This package publishes TypeScript source files (`.ts`) directly, which works great with:

- Modern bundlers (Vite, Webpack 5, Rollup, etc.)
- TypeScript projects
- Projects using `tsx` or similar TypeScript runners

**Benefits:**

- Users get full TypeScript source
- Better tree-shaking
- No build step needed
- Smaller package size

**Alternative:** If you want to publish compiled JavaScript, you would need to:

1. Add a build step that compiles TypeScript to JavaScript
2. Update `package.json` to point to compiled files
3. Include both `.ts` and `.js` files, or just `.js` files

## Version Strategy

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

## Quick Deploy Script

Create a `deploy.sh` script for easy deployment:

```bash
#!/bin/bash
set -e

echo "🧪 Running tests..."
npm test

echo "📦 Checking what will be published..."
npm pack --dry-run

echo "📝 Current version: $(node -p "require('./package.json').version")"
read -p "Enter new version (patch/minor/major or specific version): " version

if [[ "$version" =~ ^(patch|minor|major)$ ]]; then
  npm version $version
else
  npm version $version --no-git-tag-version
fi

echo "🚀 Publishing to npm..."
npm publish

echo "✅ Published successfully!"
echo "📦 Package: https://www.npmjs.com/package/magenx404"
```

Make it executable:

```bash
chmod +x deploy.sh
```

## Troubleshooting

### "Version already exists"

The version you're trying to publish already exists. Bump the version:

```bash
npm version patch
```

### "You do not have permission"

- Check you're logged in: `npm whoami`
- Verify you own the package
- Check if package name is available

### "OTP required"

If you have 2FA enabled:

```bash
npm publish --otp=<6-digit-code>
```

### "Package name already taken"

If someone else owns the name:

- Use a scoped package: `@yourusername/magenx404`
- Update `package.json` name field
- Publish with: `npm publish --access public`

### TypeScript Import Issues

If users report TypeScript import issues, ensure:

- `types` field in `package.json` points to correct location
- All type definitions are exported
- `tsconfig.json` is included in published files

## Post-Deployment

1. **Create a GitHub Release** (if using GitHub):

   ```bash
   git push --tags
   ```

   Then create a release on GitHub with changelog.

2. **Update Documentation** if needed

3. **Monitor npm Downloads** to see adoption

4. **Watch for Issues** on npm or GitHub

## Recommended Workflow

1. Make changes in a feature branch
2. Test locally
3. Update version: `npm version minor`
4. Run tests: `npm test`
5. Check package: `npm pack --dry-run`
6. Publish: `npm publish --otp=<code>`
7. Push tags: `git push --tags`
8. Create GitHub release

## Current Package Info

- **Name:** magenx404
- **Current Version:** Check with `npm view magenx404 version`
- **Type:** TypeScript source package
- **Main Entry:** `index.ts`
- **Types:** `src/types/index.d.ts`
