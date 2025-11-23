# Admin Dashboard Setup Guide

## Firestore Security Rules Configuration

The admin dashboard requires proper Firestore security rules to function correctly. This guide explains how to configure Firebase for admin access.

## Quick Setup

### 1. Get Your Admin UID

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Find your admin user account
5. Copy the **User UID** (it looks like: `abc123def456...`)

### 2. Update Firestore Rules

Open `firestore.rules` and replace the `isAdmin()` function:

**Current (temporary for development):**
```javascript
function isAdmin() {
  return isAuthenticated() && request.auth.token.email == request.auth.token.get('email', '');
}
```

**Production (recommended):**
```javascript
function isAdmin() {
  return isAuthenticated() && request.auth.uid == 'YOUR_ADMIN_UID_HERE';
}
```

Replace `'YOUR_ADMIN_UID_HERE'` with your actual admin UID from step 1.

### 3. Deploy Firestore Rules

Deploy the rules to Firebase:

```bash
firebase deploy --only firestore:rules
```

Or deploy via Firebase Console:
1. Go to **Firestore Database** → **Rules**
2. Copy the contents of `firestore.rules`
3. Paste and click **Publish**

### 4. Set Environment Variable

Add your admin email to `.env`:

```env
NEXT_PUBLIC_ADMIN_EMAIL=your-admin@email.com
```

## Advanced Setup (Recommended for Production)

For production environments, use Firebase Custom Claims for role-based access control:

### 1. Set Admin Custom Claim

Use Firebase Admin SDK (backend):

```javascript
const admin = require('firebase-admin');

// Set custom claim
admin.auth().setCustomUserClaims(adminUid, { admin: true });
```

### 2. Update isAdmin() Function

```javascript
function isAdmin() {
  return isAuthenticated() && request.auth.token.admin == true;
}
```

This approach is more flexible and doesn't require updating rules for each admin.

## What the Rules Allow

The updated Firestore rules provide:

### Admin Permissions:
- ✅ Read all user data (`users/{userId}/**`)
- ✅ Read all user profiles
- ✅ Read/write admin settings (`users/{userId}/admin/**`)
- ✅ Read all feedback
- ✅ View user statistics and analytics

### User Permissions (unchanged):
- ✅ Read/write their own data only
- ✅ Read their own admin settings (view if blocked/disabled tools)
- ✅ Create feedback
- ✅ Read public portfolios

### Security Features:
- ✅ Size validation (1MB limit)
- ✅ Authentication required
- ✅ Owner-based access control
- ✅ Admin-only write to admin settings

## Testing the Rules

### Test Admin Access
```javascript
// Should succeed with admin account
const users = await getDocs(collection(db, 'users'));

// Should succeed - write admin settings
const settingsRef = doc(db, 'users', someUserId, 'admin', 'settings');
await setDoc(settingsRef, { isBlocked: true });
```

### Test User Access
```javascript
// Should fail - user can't read other users' data
const otherUserDoc = await getDoc(doc(db, 'users', otherUserId, 'profile', 'data'));

// Should fail - user can't write admin settings
const settingsRef = doc(db, 'users', userId, 'admin', 'settings');
await setDoc(settingsRef, { isBlocked: false }); // Permission denied
```

## Troubleshooting

### "Permission denied" errors
1. Verify admin UID is correct in `isAdmin()` function
2. Ensure rules are deployed: `firebase deploy --only firestore:rules`
3. Check admin is authenticated in Firebase Console
4. Clear browser cache and re-login

### Admin can't read user data
1. Check `isAdmin()` function returns true
2. Verify the rule: `allow read: if isOwner(userId) || isAdmin();`
3. Test with Firebase Rules Playground in console

### Changes not applying
1. Rules take a few seconds to propagate
2. Force refresh the page (Ctrl+Shift+R)
3. Check Firebase Console → Firestore → Rules tab for deployment status

## Security Best Practices

1. **Never hardcode UIDs in client code** - Use server-side validation
2. **Use custom claims** for production (more flexible)
3. **Audit admin actions** - Log all admin operations
4. **Limit admin accounts** - Only trusted users
5. **Regular security reviews** - Audit rules quarterly
6. **Monitor usage** - Set up alerts for unusual activity

## File Structure

```
firestore.rules          # Security rules (deploy this)
docs/ADMIN_SETUP.md     # This guide
.env                    # NEXT_PUBLIC_ADMIN_EMAIL
```

## Summary

The Firestore rules have been updated to support the admin dashboard. Make sure to:

1. ✅ Replace `YOUR_ADMIN_UID_HERE` with your actual admin UID
2. ✅ Deploy rules: `firebase deploy --only firestore:rules`
3. ✅ Set `NEXT_PUBLIC_ADMIN_EMAIL` in environment variables
4. ✅ Test admin login and functionality

For questions, refer to [Firebase Security Rules Documentation](https://firebase.google.com/docs/firestore/security/get-started).
