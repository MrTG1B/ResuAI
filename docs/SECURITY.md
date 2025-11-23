# Security Guidelines for ResuAI
<div align="center">

# 🔒 Security Guidelines

### Enterprise-Grade Security for ResuAI

*Protecting your data and privacy with industry-leading security practices*

[![Security Status](https://img.shields.io/badge/Security-Enterprise_Grade-success?style=for-the-badge)](.)
[![Last Updated](https://img.shields.io/badge/Updated-November_2025-blue?style=for-the-badge)](.)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Security Architecture](#-security-architecture)
- [Security Measures](#-security-measures-implemented)
- [Best Practices](#-best-practices)
- [Production Deployment](#-production-deployment-checklist)
- [Vulnerability Reporting](#-reporting-security-vulnerabilities)
- [Maintenance](#-regular-security-maintenance)

---

## 🎯 Overview

ResuAI implements **enterprise-grade security measures** to protect user data, prevent attacks, and ensure privacy. This document outlines our comprehensive security architecture and provides guidelines for developers and administrators.

### Security Commitment

- ✅ **Zero-Trust Architecture** - Verify every request
- ✅ **Defense in Depth** - Multiple layers of security
- ✅ **Privacy by Design** - User data protection built-in
- ✅ **Regular Audits** - Continuous security assessments
- ✅ **Transparent Practices** - Open security documentation

---

## 🏗️ Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  • CSP Headers  • XSS Protection  • HTTPS Enforced         │
└────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Edge Network (Vercel)                     │
│  • DDoS Protection  • Rate Limiting  • Geo-Filtering       │
└────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js Application                        │
│  • Input Validation  • Auth Middleware  • Error Handling   │
└────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Firebase Services                          │
│  • Authentication  • Firestore Rules  • Secure Storage     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Security Measures Implemented

### 1. 🔐 Environment Variables Protection

**Threat**: Exposure of sensitive credentials in code repositories

**Protection**:
- All sensitive credentials are stored in `.env` files
- `.env` files are excluded from version control via `.gitignore`
- `.env.example` template provided for easy setup
- Never commit API keys, Firebase credentials, or other secrets

**Implementation**:
```typescript
// ✅ Correct - Using environment variables
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// ❌ Wrong - Hardcoded secrets
const apiKey = "AIzaSy..."; // NEVER DO THIS
```

### 2. 🛡️ HTTP Security Headers

**Threat**: XSS, clickjacking, MIME sniffing, and protocol downgrade attacks

**Protection**: Comprehensive security headers configured in `next.config.ts`

| Header | Purpose | Configuration |
|--------|---------|---------------|
| **Content-Security-Policy** | Prevents XSS attacks | Whitelist trusted sources |
| **Strict-Transport-Security** | Enforces HTTPS | 2-year max-age with preload |
| **X-Frame-Options** | Prevents clickjacking | SAMEORIGIN only |
| **X-Content-Type-Options** | Prevents MIME sniffing | nosniff |
| **X-XSS-Protection** | Browser XSS filter | Enabled with blocking |
| **Referrer-Policy** | Controls referrer info | Strict origin on HTTPS |
| **Permissions-Policy** | Restricts browser features | Clipboard, camera, mic controlled |

**CSP Configuration**:
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com https://vercel.live;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
connect-src 'self' https://*.googleapis.com https://*.firebaseio.com;
```

### 3. 🔥 Firebase Security

**Threat**: Unauthorized data access and database manipulation

**Protection**:
- **Client SDK**: Environment variables for all configuration
- **Admin SDK**: Credentials never exposed or logged
- **Authentication**: Multi-provider auth with email verification
- **Firestore Rules**: Granular access control

**Firestore Security Rules**:
```javascript
rules_version = '2';
service cloud.firestore {
   match /databases/{database}/documents {
      // User data - owner only
      match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    
      // Public portfolios - read only
      match /portfolios/{portfolioId} {
         allow read: if true;
         allow write: if request.auth != null && request.auth.uid == resource.data.userId;
      }
    
      // Feedback - create only
      match /feedback/{feedbackId} {
         allow read: if false;
         allow create: if request.auth != null;
      }
   }
}
```

**Features**:
  - Authentication required for user data access
  - Size limits (1MB) to prevent abuse
  - Owner-based access control
   - Read-only public portfolios

### 4. ⏱️ Rate Limiting & DDoS Protection

**Threat**: API abuse, brute force attacks, and DoS attempts

**Protection**:
- Server-side rate limiting middleware (100 requests/min per IP)
- Client-side rate limiter for API calls
- Prevents DoS attacks and API abuse
- Configurable limits for different endpoints
- Automatic cleanup of expired entries

**Implementation**:
```typescript
// Middleware rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const WINDOW = 60 * 1000; // 1 minute

// Client-side rate limiter
const limiter = new ClientRateLimiter(10, 1000); // 10 requests per second
```

### 5. ✅ Input Validation & Sanitization

**Threat**: SQL injection, XSS, command injection, and malicious uploads

**Protection**:
- All user inputs validated and sanitized
- Email, URL, and file validation utilities in `src/lib/security.ts`
- File type and size validation for uploads
- XSS protection through HTML sanitization
- Type safety with TypeScript

**Validation Functions**:
```typescript
// Email validation
isValidEmail(email: string): boolean

// URL validation
isValidUrl(url: string): boolean

// HTML sanitization (XSS prevention)
sanitizeHtml(html: string): string

// Input sanitization
sanitizeInput(input: string): string

// File validation
isValidFileType(file: File, allowedTypes: string[]): boolean
isValidFileSize(file: File, maxSizeMB: number): boolean
```

### 6. ⚠️ Secure Error Handling

**Threat**: Information disclosure through error messages

**Protection**:
- Generic error messages in production
- Detailed errors only in development mode
- Error boundary component prevents app crashes
- No stack traces exposed to users
- Secure logging (no sensitive data)

**Implementation**:
```typescript
// ✅ Production - Generic error
catch (error) {
   console.error('Operation failed');
   return { error: 'Unable to process request. Please try again.' };
}

// ✅ Development - Detailed error
if (process.env.NODE_ENV === 'development') {
   console.error('Full error:', error);
}
```

### 7. 🔨 Build-time Security

**Threat**: Type errors, linting issues, and code quality problems

**Protection**:
- TypeScript strict mode enabled
- ESLint checks enforced during builds
- No build errors/warnings ignored
- Pre-commit hooks for code quality
- Automated security scanning

**Configuration**:
```typescript
// next.config.ts
typescript: {
   ignoreBuildErrors: false,
},
eslint: {
   ignoreDuringBuilds: false,
}
```

### 8. 🔑 Authentication & Authorization

**Threat**: Unauthorized access and session hijacking

**Protection**:
- Firebase Authentication with multiple providers
- Email verification required
- Session management with secure tokens
- Protected routes with middleware
- Auth state persistence

### 9. 📦 Dependency Security

**Threat**: Vulnerable third-party packages

**Protection**:
- Regular dependency audits (`npm audit`)
- Automated security updates (Dependabot)
- Minimal dependency footprint
- Trusted packages only

---

## 💡 Best Practices

### For Developers

#### 1. 🔐 Never Commit Secrets

```bash
# ✅ Always check before committing
git status
git diff

# ✅ Use environment variables
const apiKey = process.env.NEXT_PUBLIC_API_KEY;

# ❌ Never hardcode secrets
const apiKey = "AIzaSy..."; // NEVER!
```

#### 2. ✅ Validate All Inputs

```typescript
import { sanitizeInput, isValidEmail, sanitizeHtml } from '@/lib/security';

// Email validation
if (!isValidEmail(email)) {
   throw new Error('Invalid email address');
}

// Input sanitization
const cleanInput = sanitizeInput(userInput);

// HTML sanitization (XSS prevention)
const safeHtml = sanitizeHtml(htmlContent);
```

#### 3. 🔒 Use Server Actions for Sensitive Operations

```typescript
'use server';

export async function sensitiveOperation(data: FormData) {
   // This code runs only on the server
   // Client cannot access or modify this logic
}
```

#### 4. 🛡️ Always Check Authentication

```typescript
// ✅ Verify authentication
if (!auth || !auth.currentUser) {
   return { error: 'Unauthorized. Please sign in.' };
}

// ✅ Verify ownership
if (resource.userId !== auth.currentUser.uid) {
   return { error: 'Forbidden. You do not own this resource.' };
}
```

#### 5. 📊 Limit Data Exposure

```typescript
// ✅ Return only necessary data
return {
   id: user.id,
   name: user.name,
   email: user.email,
};

// ❌ Don't expose sensitive data
return {
   ...user, // Might include password hash, internal IDs, etc.
};
```

#### 6. 🧪 Test Security Features

```typescript
// Test input validation
test('rejects invalid email', () => {
   expect(isValidEmail('invalid')).toBe(false);
});

// Test sanitization
test('sanitizes XSS attempt', () => {
   const malicious = '<script>alert("XSS")</script>';
   expect(sanitizeHtml(malicious)).not.toContain('<script>');
});
```

---

## 🚀 Production Deployment Checklist

Before deploying to production, ensure all security measures are in place:

### Environment Configuration

- [ ] All `.env` variables configured with production values
- [ ] No hardcoded secrets in codebase
- [ ] Firebase project configured for production
- [ ] API keys restricted to production domains
- [ ] Environment variables set in hosting platform (Vercel)

### Security Headers

- [ ] CSP configured for production domains
- [ ] HSTS enabled with preload
- [ ] All security headers verified
- [ ] HTTPS enforced on all endpoints

### Firebase Configuration

- [ ] Firestore security rules deployed
- [ ] Firebase Authentication configured
- [ ] Authorized domains added
- [ ] Storage rules configured
- [ ] Admin SDK service account secured

### Code Quality

- [ ] TypeScript build passes with no errors
- [ ] ESLint checks pass
- [ ] No console.log with sensitive data
- [ ] Error messages are generic
- [ ] Build artifacts reviewed

### Testing

- [ ] Security tests passing
- [ ] Input validation tested
- [ ] Authentication flows tested
- [ ] Rate limiting verified
- [ ] Error handling tested

### Monitoring & Logging

- [ ] Error tracking configured (e.g., Sentry)
- [ ] Security event logging enabled
- [ ] Performance monitoring active
- [ ] Alerts configured for anomalies

---

## 🚨 Reporting Security Vulnerabilities

We take security seriously and appreciate responsible disclosure.

### How to Report

**🔴 DO NOT create public GitHub issues for security vulnerabilities**

Instead, please:

1. **Email**: Send details to [tirthankardasgupta913913@gmail.com](mailto:tirthankardasgupta913913@gmail.com)
2. **Subject**: Use "SECURITY: [Brief Description]"
3. **Include**:
    - Detailed description of the vulnerability
    - Steps to reproduce
    - Potential impact
    - Suggested fix (if any)

### What to Expect

- **Response Time**: Within 48 hours
- **Updates**: Regular updates on progress
- **Resolution**: Fix deployed within 7-14 days (depending on severity)
- **Credit**: Public acknowledgment (if desired)

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| 🔴 **Critical** | RCE, data breach, auth bypass | < 24 hours |
| 🟠 **High** | XSS, CSRF, sensitive data exposure | < 48 hours |
| 🟡 **Medium** | Rate limiting bypass, info disclosure | < 1 week |
| 🟢 **Low** | Non-critical security improvements | < 2 weeks |

---

## 🔄 Regular Security Maintenance

### Monthly Tasks

- [ ] Review and update dependencies
- [ ] Run security audit: `npm audit`
- [ ] Review access logs for anomalies
- [ ] Check for outdated security practices

### Quarterly Tasks

- [ ] Comprehensive security review
- [ ] Update security documentation
- [ ] Review and update Firestore rules
- [ ] Penetration testing
- [ ] Security training for developers

### Continuous Tasks

- Monitor security advisories
- Review pull requests for security issues
- Keep dependencies updated
- Monitor application logs
- Respond to security reports

---

## 📚 Additional Resources

### Documentation

- [Security Fixes Summary](SECURITY_FIXES_SUMMARY.md)
- [Detailed Security Fixes](SECURITY_FIXES.md)
- [Main README](../README.md)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/headers)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

<div align="center">

### 🔒 Security is Everyone's Responsibility

*Last Updated: November 2025*

[![Back to README](https://img.shields.io/badge/←_Back_to-README-blue?style=for-the-badge)](../README.md)

</div>

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
