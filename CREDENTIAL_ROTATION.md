# Credential Rotation Guide

## ⚠️ EMERGENCY: Credentials Exposed in Git History

If you've accidentally committed sensitive credentials to git, follow these steps immediately:

## 1. Rotate All Credentials

### Supabase
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to Project Settings → API
3. Click "Reset JWT Secret" (this rotates both anon and service_role keys)
4. Update your `.env.local` with new keys
5. Deploy to production with new environment variables

### Razorpay
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys)
2. Generate new API keys (Key ID and Secret)
3. Go to Settings → Webhooks
4. Regenerate webhook secret
5. Update `.env.local` and production environment

### Edodwaja (if applicable)
1. Contact Edodwaja support to rotate API keys
2. Update credentials in environment variables

## 2. Remove Credentials from Git History

**WARNING**: This rewrites git history and requires force push

```bash
# Option 1: Using git filter-branch (works on all git versions)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.local' \
  --prune-empty --tag-name-filter cat -- --all

# Option 2: Using BFG Repo-Cleaner (faster, recommended)
# Download from: https://rsc.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .env.local
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push to remote (CAUTION: coordinate with team)
git push origin --force --all
git push origin --force --tags
```

## 3. Verify Removal

```bash
# Check that .env.local is not in history
git log --all --full-history -- .env.local

# Should return no results
```

## 4. Prevent Future Exposure

1. Verify `.env.local` is in `.gitignore`:
```bash
cat .gitignore | grep ".env"
```

2. Add pre-commit hook to prevent accidental commits:
```bash
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
if git diff --cached --name-only | grep -q "\.env\.local"; then
    echo "Error: Attempting to commit .env.local!"
    echo "This file contains sensitive credentials and should never be committed."
    exit 1
fi
EOF
chmod +x .git/hooks/pre-commit
```

## 5. Monitor for Exposure

1. Enable GitHub secret scanning (if using GitHub)
2. Monitor Supabase logs for suspicious activity
3. Check Razorpay dashboard for unauthorized transactions
4. Consider implementing IP whitelisting

## 6. Security Checklist

- [ ] All credentials rotated
- [ ] `.env.local` removed from git history
- [ ] Force push completed
- [ ] Team notified of new credentials
- [ ] Production environment updated
- [ ] Pre-commit hooks installed
- [ ] Security monitoring enabled
- [ ] Incident documented

## Prevention Best Practices

1. **Always** use `.env.example` for templates
2. **Never** commit actual credentials
3. **Use** environment variables in CI/CD
4. **Enable** git hooks for validation
5. **Review** PRs for accidental credential exposure
6. **Rotate** credentials periodically (every 90 days)
7. **Monitor** logs for suspicious activity

## Emergency Contacts

- **Supabase Support**: support@supabase.com
- **Razorpay Support**: https://razorpay.com/support/
- **Security Team**: [Add your security team contact]

---

**Last Updated**: October 2, 2025
**Next Review**: January 2, 2026
