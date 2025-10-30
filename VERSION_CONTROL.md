# Version Control Guide

## Current Stable Version
- **Version**: v1.0-stable
- **Commit**: d90af3b
- **Date**: 2025-10-30
- **Name**: Stable Release - Fix admin security, authentication, and implement bulk user deletion

## What's Included in v1.0-stable

### Security Features
- Non-admin users cannot see Admin Panel option
- isAdmin flag properly stored and validated
- Database-driven admin authentication

### Core Features
- User authentication (register/login)
- Task management (create, edit, delete, complete)
- Project management (create, edit, delete)
- Eisenhower Matrix view
- User subscription management (FREE/PRO/ENTERPRISE)

### Admin Features
- Admin dashboard with user overview
- User management with search
- Bulk user deletion
- User admin status assignment
- Subscription plan upgrades

### Bug Fixes
- Admin dashboard loading properly
- User deletion persists to database
- Admin authentication works with database users

---

## How to Revert to v1.0-stable

### Option 1: If you haven't committed new changes
```bash
git reset --hard v1.0-stable
```

### Option 2: If you have committed new changes
```bash
# Create a new branch first (to keep your current work)
git branch my-new-features
git checkout my-new-features

# Then reset main to stable
git checkout main
git reset --hard v1.0-stable
```

### Option 3: View what's in v1.0-stable without reverting
```bash
git checkout v1.0-stable
```
This will put you in a "detached HEAD" state. To go back:
```bash
git checkout main
```

---

## Creating New Versions

After making improvements, create a new tag:

### Minor updates (bug fixes)
```bash
git tag -a v1.0.1 -m "Description of changes"
```

### Major updates (new features)
```bash
git tag -a v1.1-stable -m "Description of changes"
```

### View all tags
```bash
git tag -l
```

### View tag details
```bash
git show v1.0-stable
```

---

## Branch Strategy for New Features

When adding project management features:

```bash
# Create a feature branch
git checkout -b feature/project-management

# Make your changes
# Test thoroughly
# Commit changes

# When ready to merge back:
git checkout main
git merge feature/project-management

# Create a new stable tag:
git tag -a v1.1-stable -m "Add project management features"
```

---

## Emergency Revert

If something goes wrong during development:

```bash
# Go back to previous commit
git reset --soft HEAD~1        # Keep your changes
git reset --hard HEAD~1        # Discard your changes

# Go back to specific version
git reset --hard v1.0-stable
```

---

## Useful Commands

```bash
# See commit history
git log --oneline

# See all branches and tags
git branch -a
git tag -l

# See what changed in a version
git diff v1.0-stable..main

# See which files changed
git show --name-status v1.0-stable
```

---

## Important Notes

⚠️ **Before major changes:**
1. Make sure you're on a feature branch, not main
2. Always test thoroughly before merging
3. Create tags for stable versions
4. Keep main branch as the production-ready version

✅ **Best practices:**
- Always commit before trying to reset
- Use descriptive commit messages
- Tag each stable release
- Use branches for new features
- Pull/push regularly to backup remote

