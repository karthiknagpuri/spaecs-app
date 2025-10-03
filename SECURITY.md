# Security Policy

## 🔒 Security Overview

This document outlines the security measures implemented in the Spaecs platform and provides guidelines for maintaining security best practices.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Email security concerns to: [Add your security email]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

**Response Time**: We aim to respond within 48 hours and provide a fix within 7 days for critical vulnerabilities.

## Security Measures Implemented

### 1. Authentication & Authorization
- ✅ Supabase Auth with Google OAuth
- ✅ Row Level Security (RLS) policies on all database tables
- ✅ Middleware-based route protection
- ✅ Session management with secure cookies
- ✅ Environment variable validation at startup

### 2. API Security
- ✅ Rate limiting on all payment endpoints (10 requests/minute)
- ✅ CSRF protection using Origin/Referer validation
- ✅ Input validation with Zod schemas
- ✅ Webhook signature verification
- ✅ SQL injection prevention through parameterized queries

### 3. Payment Security
- ✅ Razorpay signature verification
- ✅ Webhook payload validation
- ✅ Raw body parsing for signature verification
- ✅ Amount validation and limits
- ✅ Sensitive data sanitization in logs

### 4. Data Protection
- ✅ Environment variables for sensitive credentials
- ✅ No credentials in version control
- ✅ Structured logging with PII redaction
- ✅ HTTPS enforcement in production

### 5. Error Handling
- ✅ Graceful error handling with safe defaults
- ✅ No sensitive data in error messages
- ✅ Structured error logging
- ✅ Security event tracking

## Security Best Practices

### For Developers

1. **Never Commit Secrets**
   - Always use `.env.local` for local development
   - Use `.env.example` as a template
   - Check environment variables before committing

2. **Input Validation**
   - Always validate user input using Zod schemas
   - Sanitize data before database operations
   - Use prepared statements for SQL queries

3. **Authentication**
   - Always check user session in protected routes
   - Use Supabase RLS for database-level security
   - Implement proper error handling for auth failures

4. **Logging**
   - Never log sensitive data (passwords, tokens, card numbers)
   - Use the structured logger (`src/lib/logger.ts`)
   - Include security event logging

5. **Dependencies**
   - Run `npm audit` regularly
   - Keep dependencies up to date
   - Review security advisories

### For Production Deployment

1. **Environment Variables**
   ```bash
   # Required production environment variables
   NEXT_PUBLIC_SUPABASE_URL=<your-production-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-production-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

   RAZORPAY_KEY_ID=<your-production-key-id>
   RAZORPAY_KEY_SECRET=<your-production-secret>
   RAZORPAY_WEBHOOK_SECRET=<your-webhook-secret>

   NEXT_PUBLIC_APP_URL=https://spaecs.app
   ```

2. **Security Headers**
   Add to `next.config.ts`:
   ```typescript
   async headers() {
     return [
       {
         source: '/(.*)',
         headers: [
           {
             key: 'X-Frame-Options',
             value: 'DENY',
           },
           {
             key: 'X-Content-Type-Options',
             value: 'nosniff',
           },
           {
             key: 'Referrer-Policy',
             value: 'strict-origin-when-cross-origin',
           },
           {
             key: 'Permissions-Policy',
             value: 'camera=(), microphone=(), geolocation=()',
           },
         ],
       },
     ];
   }
   ```

3. **Database Security**
   - Enable RLS on all tables
   - Review and test RLS policies
   - Use service role key only in trusted server contexts
   - Enable database backups

4. **Monitoring**
   - Set up error monitoring (Sentry, etc.)
   - Monitor rate limit violations
   - Track failed authentication attempts
   - Set up alerts for security events

## Security Checklist

### Before Production Launch

- [ ] All credentials rotated from development
- [ ] Environment variables configured in production
- [ ] HTTPS enabled and enforced
- [ ] Security headers configured
- [ ] RLS policies tested
- [ ] Rate limiting enabled
- [ ] Webhook signatures verified
- [ ] Error monitoring configured
- [ ] Backup strategy implemented
- [ ] Security testing completed
- [ ] Penetration testing performed (recommended)

### Regular Maintenance

- [ ] Monthly dependency audits (`npm audit`)
- [ ] Quarterly credential rotation
- [ ] Regular security log reviews
- [ ] Penetration testing (annually)
- [ ] Security training for team members

## Compliance

### Data Protection
- User data is stored securely in Supabase (PostgreSQL)
- Passwords are never stored (OAuth only)
- Payment data is handled by Razorpay (PCI DSS compliant)
- User consent required for data collection

### GDPR Compliance (if applicable)
- Right to access: Users can view their data
- Right to deletion: Contact security team
- Data portability: Export functionality available
- Privacy policy: [Add link to privacy policy]

## Security Updates

This document is maintained and updated regularly. Last updated: **October 2, 2025**

### Recent Security Improvements

**October 2, 2025**:
- ✅ Added rate limiting to payment endpoints
- ✅ Implemented CSRF protection
- ✅ Added input validation with Zod
- ✅ Improved webhook signature verification
- ✅ Created structured logging system
- ✅ Fixed middleware error handling
- ✅ Added credential rotation documentation

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/security)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [Razorpay Security](https://razorpay.com/docs/payments/security/)

## Contact

For security concerns, please contact:
- Email: [Add security email]
- Security Team: [Add team contact]

---

**Remember**: Security is everyone's responsibility. When in doubt, ask!
