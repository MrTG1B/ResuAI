# Google Sign-In Setup Guide

This guide will help you enable Google Sign-In for your ResuAI application.

## Prerequisites

- A Firebase project (if you don't have one, create it at [Firebase Console](https://console.firebase.google.com/))
- Your application already has Firebase initialized (checked in `src/lib/firebase.ts`)

## Step 1: Enable Google Sign-In in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Authentication** in the left sidebar
4. Click on the **Sign-in method** tab
5. Find **Google** in the list of providers
6. Click on **Google** to configure it
7. Toggle the **Enable** switch to ON
8. Enter your **Project support email** (required)
9. Click **Save**

## Step 2: Configure Authorized Domains

Google Sign-In will only work from authorized domains. You need to add your domains:

1. In Firebase Console, go to **Authentication** → **Settings** → **Authorized domains**
2. By default, `localhost` and your Firebase hosting domain are already authorized
3. Add any custom domains you're using:
   - Click **Add domain**
   - Enter your domain (e.g., `yourdomain.com`)
   - Click **Add**

### Common Authorized Domains:
- `localhost` (for local development)
- `127.0.0.1` (alternative localhost)
- `your-project-id.web.app` (Firebase Hosting)
- `your-project-id.firebaseapp.com` (Firebase Hosting alternative)
- Your custom domain (if applicable)

## Step 3: Verify Firebase Configuration

Make sure your `.env` file has all required Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

You can find these values in:
- Firebase Console → Project Settings → General → Your apps → SDK setup and configuration

## Step 4: Test Google Sign-In

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the login page:**
   - Go to `http://localhost:3000/login`
   - Or signup page: `http://localhost:3000/signup`

3. **Click "Sign in with Google" button**

4. **Expected behavior:**
   - A popup window should appear
   - You'll see the Google account selection screen
   - After selecting an account, you should be redirected to the dashboard

## Common Issues and Solutions

### Issue 1: "Pop-up was blocked by your browser"

**Solution:**
- Allow pop-ups for your domain in browser settings
- Click the pop-up blocker icon in the address bar and allow pop-ups
- Try again

### Issue 2: "This domain is not authorized for Google sign-in"

**Error code:** `auth/unauthorized-domain`

**Solution:**
1. Go to Firebase Console → Authentication → Settings → Authorized domains
2. Add the domain you're accessing the app from
3. Wait a few minutes for changes to propagate
4. Try again

### Issue 3: "Google sign-in is not enabled"

**Error code:** `auth/operation-not-allowed`

**Solution:**
1. Go to Firebase Console → Authentication → Sign-in method
2. Make sure Google provider is **Enabled** (toggle should be ON)
3. Save changes
4. Try again

### Issue 4: "Pop-up closed by user"

**Error code:** `auth/popup-closed-by-user`

**Solution:**
- This happens when you close the Google Sign-In popup
- Simply try again and complete the sign-in process

### Issue 5: "An account already exists with the same email address"

**Error code:** `auth/account-exists-with-different-credential`

**Solution:**
- You already have an account with this email using a different sign-in method
- If you created an account with email/password, use that method to sign in
- If you want to link accounts, sign in with your original method first
- Contact support if you need help linking accounts

### Issue 6: "Only one popup request is allowed at a time"

**Error code:** `auth/cancelled-popup-request`

**Solution:**
- This occurs when you click the Google Sign-In button multiple times quickly
- Wait for the first popup to complete or close it
- Click the button once and wait for the popup to appear
- If stuck, refresh the page and try again

### Issue 7: CORS errors or redirect issues

**Solution:**
1. Verify all domains in Authorized domains list
2. Check that `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` is correctly set in `.env`
3. Clear browser cache and cookies
4. Try in incognito/private browsing mode

## Testing Checklist

After setup, verify the following:

- [ ] Google Sign-In works on **Login page** (`/login`)
- [ ] Google Sign-In works on **Signup page** (`/signup`)
- [ ] Google Sign-In works on **Admin Login page** (`/admin/login`)
- [ ] After signing in, user is redirected to appropriate page
- [ ] User information (name, email) is correctly stored in Firebase Auth
- [ ] No console errors related to authentication

## Production Deployment

When deploying to production:

1. **Add your production domain to Authorized domains**
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add your production URL (e.g., `app.yourdomain.com`)

2. **Verify environment variables**
   - Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set in production environment
   - Use your hosting platform's environment variable settings (Vercel, Netlify, etc.)

3. **Test thoroughly**
   - Test Google Sign-In on production URL
   - Verify redirects work correctly
   - Check that user data is saved properly

## Code Implementation

The Google Sign-In functionality is already implemented in:

- **Login Page:** `/src/app/login/page.tsx`
- **Signup Page:** `/src/app/signup/page.tsx`
- **Admin Login Page:** `/src/app/admin/login/page.tsx`

All pages use `signInWithPopup` from Firebase Auth with proper error handling.

### Recent Improvements (Latest Update)

The Google Sign-In implementation has been enhanced with:

1. **Better User Experience:**
   - Added `prompt: 'select_account'` parameter to always show account selection screen
   - This prevents automatic sign-in and gives users control over which account to use

2. **Enhanced Error Handling:**
   - Added handling for `auth/account-exists-with-different-credential` error
   - Added handling for `auth/cancelled-popup-request` error (multiple popup attempts)
   - Improved error messages for better user guidance

3. **Consistent Implementation:**
   - All three authentication pages (login, signup, admin) have the same configuration
   - Uniform error handling across all pages

## Security Considerations

1. **Firestore Rules:** Make sure your Firestore rules allow authenticated users to read/write their own data
2. **User Data:** User profile information from Google is automatically stored in Firebase Auth
3. **Email Verification:** Google-authenticated users are automatically verified
4. **Account Linking:** Users can sign in with both email/password and Google (same email links accounts)

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Google Sign-In for Web](https://firebase.google.com/docs/auth/web/google-signin)
- [Manage Authorized Domains](https://firebase.google.com/docs/auth/web/google-signin#authenticate_with_firebase)

## Support

If you continue to have issues:

1. Check the browser console for detailed error messages
2. Verify Firebase Console shows the Google provider is enabled
3. Make sure you're using a supported browser (Chrome, Firefox, Safari, Edge)
4. Try signing in with a different Google account
5. Check Firebase Console → Authentication → Users to see if accounts are being created

## Summary

To enable Google Sign-In:

1. ✅ Enable Google provider in Firebase Console
2. ✅ Add authorized domains (including localhost for development)
3. ✅ Verify Firebase configuration in `.env`
4. ✅ Test on login, signup, and admin login pages
5. ✅ Add production domain before deploying

The code is already implemented and ready to use once Firebase is properly configured!
