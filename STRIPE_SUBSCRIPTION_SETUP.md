# 🎯 STRIPE SUBSCRIPTION SYSTEM - SETUP GUIDE

**Complete subscription system using Stripe Web Checkout only**

---

## 📋 OVERVIEW

This system implements a **web-only subscription** model:
- ✅ Payments occur **only in web browser** (Stripe Checkout)
- ✅ Mobile app **never displays pricing or payment buttons**
- ✅ Mobile app can request activation link → opens browser
- ✅ Account linking via `client_reference_id = userId`
- ✅ All AI features protected server-side

---

## 🏗️ ARCHITECTURE

```
Mobile App
  └─> POST /account/activation-link
      └─> Returns checkout URL
          └─> Opens in external browser
              └─> Stripe Checkout (web)
                  └─> Webhook → Updates database
```

---

## 📦 COMPONENTS

### 1. Database Migration
- **File:** `supabase/migrations/20250127000000_create_subscription_system.sql`
- **Tables:** `subscriptions`
- **RLS:** Users can read own subscription

### 2. Edge Functions

#### `account-activation-link`
- **Purpose:** Creates Stripe Checkout Session
- **Method:** POST
- **Auth:** Required
- **Returns:** `{ checkoutUrl: string, sessionId: string }`

#### `stripe-webhook`
- **Purpose:** Handles Stripe webhook events
- **Method:** POST
- **Auth:** Webhook signature verification
- **Events:** 
  - `checkout.session.completed` → Activate subscription
  - `customer.subscription.deleted` → Deactivate subscription
  - `customer.subscription.updated` → Update subscription

#### `get-subscription`
- **Purpose:** Get current user's subscription status
- **Method:** GET
- **Auth:** Required
- **Returns:** `{ subscription: object | null, isActive: boolean }`

#### `check-subscription`
- **Purpose:** Middleware to check subscription before AI features
- **Method:** GET/POST
- **Auth:** Required
- **Returns:** `{ isActive: boolean }` or 403

---

## 🔧 SETUP INSTRUCTIONS

### Step 1: Database Migration

```bash
# Apply migration
supabase migration up
```

Or manually run the SQL file in Supabase Dashboard.

### Step 2: Stripe Configuration

1. **Create Stripe Account** (if not exists)
   - Go to https://stripe.com
   - Create account

2. **Create Product & Price**
   - Dashboard → Products → Add Product
   - Set name, description
   - Add Price (recurring subscription)
   - **Copy the Price ID** (starts with `price_...`)

3. **Get API Keys**
   - Dashboard → Developers → API keys
   - **Copy Secret Key** (starts with `sk_...`)
   - **Copy Publishable Key** (starts with `pk_...`) - for web frontend

4. **Configure Webhook**
   - Dashboard → Developers → Webhooks
   - Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.deleted`
     - `customer.subscription.updated`
   - **Copy Webhook Signing Secret** (starts with `whsec_...`)

### Step 3: Supabase Secrets

```bash
# Set Stripe Secret Key
supabase secrets set STRIPE_SECRET_KEY=sk_live_... # or sk_test_...

# Set Stripe Price ID
supabase secrets set STRIPE_PRICE_ID=price_...

# Set Stripe Webhook Secret
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Set Web Base URL (for success/cancel redirects)
supabase secrets set WEB_BASE_URL=https://yourdomain.com
```

### Step 4: Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy account-activation-link
supabase functions deploy stripe-webhook
supabase functions deploy get-subscription
supabase functions deploy check-subscription

# Update existing AI function with subscription check
supabase functions deploy llama-proxy-ollama-cloud
```

### Step 5: Configure Webhook URL in Stripe

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Select events (see Step 2)
4. Save and copy the webhook signing secret

---

## 📱 MOBILE APP INTEGRATION

### Example: Request Activation Link

```typescript
// application/src/services/subscription.ts

import { supabase } from '@/lib/supabase';

export async function requestActivationLink(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('account-activation-link', {
    method: 'POST',
  });

  if (error || !data?.checkoutUrl) {
    throw new Error('Failed to create activation link');
  }

  return data.checkoutUrl;
}

// Usage in component
import { Linking } from 'react-native';

const handleActivate = async () => {
  try {
    const checkoutUrl = await requestActivationLink();
    await Linking.openURL(checkoutUrl);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Example: Check Subscription Status

```typescript
export async function getSubscriptionStatus(): Promise<{
  subscription: any | null;
  isActive: boolean;
}> {
  const { data, error } = await supabase.functions.invoke('get-subscription', {
    method: 'GET',
  });

  if (error) {
    throw error;
  }

  return data;
}
```

### Example: UI Component

```typescript
// application/src/components/SubscriptionGate.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Linking } from 'react-native';
import { getSubscriptionStatus, requestActivationLink } from '@/services/subscription';

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const { isActive: active } = await getSubscriptionStatus();
      setIsActive(active);
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async () => {
    try {
      const checkoutUrl = await requestActivationLink();
      await Linking.openURL(checkoutUrl);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (loading) {
    return <View><Text>Loading...</Text></View>;
  }

  if (!isActive) {
    return (
      <View>
        <Text>This feature requires an active account.</Text>
        <Pressable onPress={handleActivate}>
          <Text>Activate my account</Text>
        </Pressable>
      </View>
    );
  }

  return <>{children}</>;
}
```

---

## 🔒 SECURITY

### ✅ Implemented

- ✅ Webhook signature verification
- ✅ `client_reference_id` for account linking (not email)
- ✅ Server-side subscription validation
- ✅ RLS policies on subscriptions table
- ✅ No Stripe keys in mobile app

### ⚠️ Important Notes

1. **Never trust client-side subscription state**
   - Always validate server-side
   - Use `check-subscription` before AI features

2. **Webhook Security**
   - Always verify webhook signature
   - Use `STRIPE_WEBHOOK_SECRET` from Supabase Secrets

3. **Account Linking**
   - Uses `client_reference_id = userId` (secure)
   - Never rely on email matching alone

---

## 🧪 TESTING

### Test Checkout Flow

1. **Create test user** in Supabase
2. **Call activation link endpoint:**
   ```bash
   curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/account-activation-link \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json"
   ```
3. **Open returned URL** in browser
4. **Complete test payment** (use Stripe test card: `4242 4242 4242 4242`)
5. **Verify webhook** received and subscription created

### Test Webhook Locally

```bash
# Install Stripe CLI
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

# Trigger test event
stripe trigger checkout.session.completed
```

---

## 📊 MONITORING

### Check Subscription Status

```sql
-- View all active subscriptions
SELECT * FROM subscriptions WHERE status = 'active';

-- View subscriptions expiring soon
SELECT * FROM subscriptions 
WHERE status = 'active' 
AND expires_at < NOW() + INTERVAL '7 days';
```

### Stripe Dashboard

- Monitor payments: Dashboard → Payments
- Monitor subscriptions: Dashboard → Subscriptions
- View webhook logs: Dashboard → Developers → Webhooks → [Your endpoint] → Logs

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] Database migration applied
- [ ] Stripe account created
- [ ] Product & Price created (Price ID copied)
- [ ] Stripe API keys obtained
- [ ] Webhook endpoint configured in Stripe
- [ ] Webhook signing secret copied
- [ ] Supabase secrets configured:
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_PRICE_ID`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `WEB_BASE_URL`
- [ ] Edge functions deployed
- [ ] Webhook URL added in Stripe Dashboard
- [ ] Test checkout flow completed
- [ ] Test webhook received successfully
- [ ] Mobile app integration completed

---

## 📝 NOTES

- **No in-app purchases** - All payments via web
- **No pricing in mobile** - Only "Activate my account" button
- **Backend is source of truth** - Always validate server-side
- **AI features protected** - Check subscription before allowing access

---

**Last Updated:** 2025-01-27


