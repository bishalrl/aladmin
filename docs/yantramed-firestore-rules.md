# YantraMed Firestore security rules

Deploy these rules in Firebase Console → Firestore → Rules (YantraMed project).

Payment and subscription fields are written **only** by the admin server (Firebase Admin SDK via Paddle webhooks). The mobile app may **read** its own user document.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;

      match /payments/{paymentId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow write: if false;
      }
    }

    // Complimentary grants — Admin SDK only (never client-writable)
    match /comp_access/{email} {
      allow read, write: if false;
    }
  }
}
```

## Document shape (written by server)

```
users/{firebaseUid}
  email: string
  display_name: string | null
  photo_url: string | null
  subscription: {
    has_access: boolean
    tier: "starter" | "pro" | "advanced" | null
    status: string
    subscription_id: string | null
    customer_id: string | null
    price_id: string | null
    product_id: string | null
    plan_name: "Starter" | "Pro" | "Advanced" | null
    billing_interval: "month" | "year" | null
    provider: "paddle"
    updated_at: timestamp
  }

users/{firebaseUid}/payments/{transactionId}
  id: string
  status: string
  subscription_id: string | null
  customer_id: string | null
  tier: string | null
  plan_name: string | null
  email: string
  provider: "paddle"
  created_at: timestamp
```

## Complimentary / tester access

Grant full Advanced access without Paddle:

```bash
npx tsx scripts/grant-yantramed-tester.ts tester@gmail.com
```

Writes:
- `comp_access/{email}` — source of truth for complimentary grants
- `users/{uid}.subscription` — if that Google account already signed into the app

Revoke:

```bash
npx tsx scripts/grant-yantramed-tester.ts tester@gmail.com --revoke
```

Tester signs into the YantraMed app with that same Gmail → `has_access: true`, `tier: advanced`.

If they have never signed in yet, run the grant script again after their first login so `users/{uid}` is written for Firestore listeners.
