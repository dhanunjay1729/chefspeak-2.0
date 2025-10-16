# Security Policy

## Current Security Considerations

### ⚠️ Known Security Issues

1. **API Keys Exposed in Frontend**
   - **Issue:** OpenAI and Unsplash API keys are currently stored in environment variables that are bundled into the client-side code.
   - **Risk:** These keys can be extracted from the built JavaScript files.
   - **Mitigation:** 
     - Use rate limiting on API keys
     - Restrict API key permissions
     - For production, move API calls to serverless functions or a backend API
   - **Planned Fix:** Implement serverless functions for API calls

2. **Google TTS Key File**
   - **Issue:** The `google-tts-key.json` file contains sensitive credentials.
   - **Risk:** If committed to version control, credentials could be exposed.
   - **Mitigation:** 
     - File is in `.gitignore`
     - Never commit this file
     - Use environment variables or secret managers in production

3. **Firebase Security Rules**
   - **Issue:** Firestore security rules need to be properly configured.
   - **Risk:** Unauthorized access to user data.
   - **Mitigation:** Implement proper Firestore security rules

## Recommended Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Sub-collections
      match /recentDishes/{dishId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /favoriteDishes/{dishId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Best Practices for Production

1. **Environment Variables**
   - Never commit `.env` files
   - Use platform-specific secret management (Vercel Secrets, Netlify Environment Variables, etc.)
   - Rotate API keys regularly

2. **API Rate Limiting**
   - Implement rate limiting on all API endpoints
   - Monitor usage to detect abuse

3. **CORS Configuration**
   - Configure CORS properly for production domains
   - Don't use wildcard (`*`) origins in production

4. **Authentication**
   - Enforce strong password policies
   - Implement email verification
   - Consider adding 2FA for user accounts

5. **Data Validation**
   - Validate all user inputs on both client and server
   - Sanitize data before storing in database

6. **HTTPS Only**
   - Always use HTTPS in production
   - Set secure cookies

## Reporting Security Issues

If you discover a security vulnerability, please email [your-email@example.com] instead of using the issue tracker.

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will respond within 48 hours and work with you to address the issue.

## Security Updates

We recommend:
- Keeping all dependencies up to date
- Running `npm audit` regularly
- Subscribing to security advisories for used packages
