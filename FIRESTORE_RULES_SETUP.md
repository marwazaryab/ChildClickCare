# Firestore Security Rules Setup

## Issue
You're getting a "Missing or insufficient permissions" error when trying to add emergency contacts. This is because the Firestore security rules need to be updated to allow access to the emergency contacts subcollection.

## Solution

### Option 1: Update Rules in Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `wiehackathon-db039`
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace the existing rules with the content from `firestore.rules` file
5. Click **Publish** to save the rules

### Option 2: Use Firebase CLI

If you have Firebase CLI installed:

```bash
firebase deploy --only firestore:rules
```

## What These Rules Do

- **Users Collection**: Allows authenticated users to read and write their own profile documents (matching by `authUid`)
- **Emergency Contacts Subcollection**: Allows authenticated users to:
  - Read their own emergency contacts
  - Create new emergency contacts under their profile
  - Update their own emergency contacts
  - Delete their own emergency contacts

The rules verify ownership by checking that the `authUid` field in the user document matches the authenticated user's UID.

## Testing

After updating the rules, try adding an emergency contact again. The permission error should be resolved.
