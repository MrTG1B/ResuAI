# Security Guidelines for ResuAI

## Overview
This document outlines the security measures implemented in ResuAI and best practices for maintaining security.

## Security Measures Implemented

### 1. **Environment Variables Protection**
- All sensitive credentials are stored in `.env` files
- `.env` files are excluded from version control via `.gitignore`
- `.env.example` template provided for easy setup
- Never commit API keys, Firebase credentials, or other secrets

### 2. **HTTP Security Headers**
The following security headers are configured in `next.config.ts`:
- **Content-Security-Policy (CSP)**: Prevents XSS attacks
- **Strict-Transport-Security (HSTS)**: Enforces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME-type sniffing
- **X-XSS-Protection**: Additional XSS protection for older browsers
- **Referrer-Policy**: Controls referrer information
- **Permissions-Policy**: Restricts browser features

### 3. **Firebase Security**
- **Client SDK**: Uses environment variables for configuration
- **Admin SDK**: Credentials never logged in production
- **Firestore Rules**: 
  - Authentication required for user data access
  - Size limits (1MB) to prevent abuse
  - Owner-based access control
  - Public portfolios intentionally public (by design)

### 4. **Rate Limiting**
- Middleware implements rate limiting (100 requests/minute per IP)
- Prevents DoS attacks and API abuse
- Configurable limits for different endpoints

### 5. **Input Validation**
- All user inputs validated and sanitized
- Email, URL, and file validation utilities in `src/lib/security.ts`
- File type and size validation for uploads
- XSS protection through HTML sanitization

### 6. **Error Handling**
- Generic error messages in production
- Detailed errors only in development mode
- Error boundary component prevents app crashes
- No stack traces exposed to users

### 7. **Build-time Security**
- TypeScript strict mode enabled
- ESLint checks enforced during builds
- No build errors/warnings ignored

## Best Practices

### For Developers

1. **Never commit secrets**
   ```bash
   # Always check before committing
   git diff
   # Use environment variables
   process.env.NEXT_PUBLIC_API_KEY
   ```

2. **Validate all inputs**
   ```typescript
   import { sanitizeInput, isValidEmail } from '@/lib/security';
   
   const cleanInput = sanitizeInput(userInput);
   if (!isValidEmail(email)) {
     throw new Error('Invalid email');
   }
   ```

3. **Use server actions for sensitive operations**
   ```typescript
   'use server';
   // Server-side code only
   ```

4. **Check authentication before database operations**
   ```typescript
   if (!auth || !auth.currentUser) {
     return { error: 'Unauthorized' };
   }
   ```

5. **Limit data exposure**
   ```typescript
   // Don't expose internal IDs or sensitive data
   return {
     publicData: data.public,
     // NOT: internalId, adminData, etc.
   };
   ```

### For Production Deployment

1. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Fill in all required credentials
   - Use production Firebase project
   - Enable Firebase App Check for additional security

2. **Firebase Configuration**
   - Deploy Firestore security rules: `firebase deploy --only firestore:rules`
   - Enable Firebase Authentication
   - Configure authorized domains
   - Set up Firebase App Check

3. **Monitoring**
   - Monitor Firebase usage and quotas
   - Set up error logging (e.g., Sentry)
   - Review security headers with tools like securityheaders.com
   - Regular npm audit checks

4. **HTTPS**
   - Always use HTTPS in production
   - Vercel automatically provides SSL certificates
   - Enforce HSTS headers (already configured)

## Security Checklist

Before deploying:
- [ ] All `.env` variables are set correctly
- [ ] Firebase security rules deployed
- [ ] No secrets in code or committed files
- [ ] HTTPS enforced
- [ ] Error messages don't expose sensitive information
- [ ] Rate limiting configured appropriately
- [ ] All dependencies updated and audited
- [ ] CSP headers tested and working
- [ ] Authentication flows tested
- [ ] File upload validation working

## Reporting Security Issues

If you discover a security vulnerability:
1. **Do NOT** open a public issue
2. Email the maintainer directly
3. Provide detailed information about the vulnerability
4. Wait for a response before disclosing publicly

## Regular Maintenance

- Run `npm audit` regularly to check for vulnerabilities
- Keep dependencies updated
- Review Firebase usage and logs
- Monitor for unusual activity
- Update security headers as needed

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Firebase Security](https://firebase.google.com/docs/rules)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
