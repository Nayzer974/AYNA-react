-- ============================================
-- GIFT CODES SYSTEM - FREE SUBSCRIPTION CODES
-- ============================================
-- This migration creates the gift code system
-- for granting free subscriptions via promotional codes
-- 
-- CODE TYPES:
-- - 1_week: 7 days subscription
-- - 1_month: 30 days subscription
-- - 1_year: 365 days subscription
-- - lifetime: No expiration (null expires_at)

-- ============================================
-- 1. GIFT CODES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  code_type TEXT NOT NULL CHECK (code_type IN ('1_week', '1_month', '1_year', 'lifetime')),
  max_uses INTEGER DEFAULT 1, -- How many times this code can be used (null = unlimited)
  current_uses INTEGER DEFAULT 0, -- Current number of uses
  is_active BOOLEAN DEFAULT true, -- Can be deactivated by admin
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Code expiration (null = never expires)
  created_by UUID REFERENCES auth.users(id), -- Admin who created the code
  notes TEXT -- Optional notes about this code
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_gift_codes_code_type ON gift_codes(code_type);
CREATE INDEX IF NOT EXISTS idx_gift_codes_is_active ON gift_codes(is_active);

-- ============================================
-- 2. GIFT CODE REDEMPTIONS TABLE
-- ============================================
-- Track who redeemed which codes

CREATE TABLE IF NOT EXISTS gift_code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_code_id UUID NOT NULL REFERENCES gift_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  subscription_granted_until TIMESTAMPTZ, -- When the granted subscription expires (null for lifetime)
  
  -- Prevent same user from redeeming same code twice
  UNIQUE(gift_code_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gift_code_redemptions_user_id ON gift_code_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_code_redemptions_gift_code_id ON gift_code_redemptions(gift_code_id);

-- ============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE gift_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_code_redemptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role can manage gift codes" ON gift_codes;
DROP POLICY IF EXISTS "Users can read own redemptions" ON gift_code_redemptions;
DROP POLICY IF EXISTS "Service role can manage redemptions" ON gift_code_redemptions;
DROP POLICY IF EXISTS "Service role full access on gift_codes" ON gift_codes;
DROP POLICY IF EXISTS "Service role full access on gift_code_redemptions" ON gift_code_redemptions;

-- Policy: Only admins can read gift codes (via service role)
CREATE POLICY "Service role can manage gift codes"
  ON gift_codes
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policy: Users can read their own redemptions
CREATE POLICY "Users can read own redemptions"
  ON gift_code_redemptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage redemptions
CREATE POLICY "Service role can manage redemptions"
  ON gift_code_redemptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS calculate_subscription_end_date(TEXT);
DROP FUNCTION IF EXISTS redeem_gift_code(TEXT, UUID);
DROP FUNCTION IF EXISTS create_gift_code(TEXT, TEXT, INTEGER, TIMESTAMPTZ, TEXT);

-- Function to calculate subscription end date based on code type
CREATE OR REPLACE FUNCTION calculate_subscription_end_date(p_code_type TEXT)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE p_code_type
    WHEN '1_week' THEN
      RETURN NOW() + INTERVAL '7 days';
    WHEN '1_month' THEN
      RETURN NOW() + INTERVAL '30 days';
    WHEN '1_year' THEN
      RETURN NOW() + INTERVAL '365 days';
    WHEN 'lifetime' THEN
      RETURN NULL; -- Lifetime = no expiration
    ELSE
      RETURN NOW() + INTERVAL '7 days'; -- Default to 1 week
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to redeem a gift code
CREATE OR REPLACE FUNCTION redeem_gift_code(p_code TEXT, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_gift_code RECORD;
  v_subscription_end TIMESTAMPTZ;
  v_existing_subscription RECORD;
  v_result JSONB;
BEGIN
  -- Find the gift code
  SELECT * INTO v_gift_code
  FROM gift_codes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > NOW())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  -- Check if code exists and is valid
  IF v_gift_code IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_CODE',
      'message', 'Code invalide ou expiré'
    );
  END IF;
  
  -- Check if user already redeemed this code
  IF EXISTS (
    SELECT 1 FROM gift_code_redemptions
    WHERE gift_code_id = v_gift_code.id AND user_id = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ALREADY_REDEEMED',
      'message', 'Vous avez déjà utilisé ce code'
    );
  END IF;
  
  -- Calculate subscription end date
  v_subscription_end := calculate_subscription_end_date(v_gift_code.code_type);
  
  -- Check if user has existing subscription and extend it
  SELECT * INTO v_existing_subscription
  FROM subscriptions
  WHERE user_id = p_user_id;
  
  IF v_existing_subscription IS NOT NULL THEN
    -- User has existing subscription
    IF v_existing_subscription.status = 'active' 
       AND v_existing_subscription.expires_at IS NOT NULL 
       AND v_existing_subscription.expires_at > NOW() THEN
      -- Extend existing subscription (add time to current expiration)
      IF v_subscription_end IS NOT NULL THEN
        -- Non-lifetime code: add duration to existing expiration
        v_subscription_end := v_existing_subscription.expires_at + 
          CASE v_gift_code.code_type
            WHEN '1_week' THEN INTERVAL '7 days'
            WHEN '1_month' THEN INTERVAL '30 days'
            WHEN '1_year' THEN INTERVAL '365 days'
            ELSE INTERVAL '7 days'
          END;
      END IF;
      -- Lifetime code: v_subscription_end stays NULL (never expires)
    END IF;
    
    -- Update existing subscription
    UPDATE subscriptions
    SET 
      status = 'active',
      expires_at = v_subscription_end,
      updated_at = NOW(),
      source = 'web' -- Keep as web source
    WHERE user_id = p_user_id;
  ELSE
    -- Create new subscription
    INSERT INTO subscriptions (user_id, status, source, expires_at)
    VALUES (p_user_id, 'active', 'web', v_subscription_end);
  END IF;
  
  -- Record the redemption
  INSERT INTO gift_code_redemptions (gift_code_id, user_id, subscription_granted_until)
  VALUES (v_gift_code.id, p_user_id, v_subscription_end);
  
  -- Increment usage counter
  UPDATE gift_codes
  SET current_uses = current_uses + 1
  WHERE id = v_gift_code.id;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'code_type', v_gift_code.code_type,
    'subscription_expires_at', v_subscription_end,
    'message', CASE v_gift_code.code_type
      WHEN '1_week' THEN 'Abonnement 1 semaine activé !'
      WHEN '1_month' THEN 'Abonnement 1 mois activé !'
      WHEN '1_year' THEN 'Abonnement 1 an activé !'
      WHEN 'lifetime' THEN 'Abonnement à vie activé !'
      ELSE 'Abonnement activé !'
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION redeem_gift_code(TEXT, UUID) TO authenticated;

-- ============================================
-- 5. HELPER FUNCTIONS FOR ADMIN
-- ============================================

-- Function to create a gift code (admin only, via service role)
CREATE OR REPLACE FUNCTION create_gift_code(
  p_code TEXT,
  p_code_type TEXT,
  p_max_uses INTEGER DEFAULT 1,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_new_id UUID;
BEGIN
  INSERT INTO gift_codes (code, code_type, max_uses, expires_at, notes)
  VALUES (UPPER(TRIM(p_code)), p_code_type, p_max_uses, p_expires_at, p_notes)
  RETURNING id INTO v_new_id;
  
  RETURN v_new_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. UPDATE SUBSCRIPTION SOURCE CONSTRAINT
-- ============================================
-- Allow 'gift_code' as a valid source for subscriptions

-- Drop the existing constraint
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_source_check;

-- Add the new constraint that allows both 'web' and 'gift_code'
ALTER TABLE subscriptions 
ADD CONSTRAINT subscriptions_source_check 
CHECK (source IN ('web', 'gift_code'));

-- Update the default value comment
COMMENT ON COLUMN subscriptions.source IS 'Payment source - "web" (Stripe checkout) or "gift_code" (promotional codes)';

-- ============================================
-- 7. TEST CODES
-- ============================================
-- Codes de test pour développement

-- Code 1 semaine (10 utilisations max)
INSERT INTO gift_codes (code, code_type, max_uses, notes)
VALUES ('AYNA-TEST-WEEK', '1_week', 10, 'Code test 1 semaine')
ON CONFLICT (code) DO NOTHING;

-- Code 1 mois (10 utilisations max)
INSERT INTO gift_codes (code, code_type, max_uses, notes)
VALUES ('AYNA-TEST-MONTH', '1_month', 10, 'Code test 1 mois')
ON CONFLICT (code) DO NOTHING;

-- Code 1 an (5 utilisations max)
INSERT INTO gift_codes (code, code_type, max_uses, notes)
VALUES ('AYNA-TEST-YEAR', '1_year', 5, 'Code test 1 an')
ON CONFLICT (code) DO NOTHING;

-- Code à vie (3 utilisations max)
INSERT INTO gift_codes (code, code_type, max_uses, notes)
VALUES ('AYNA-VIP-LIFETIME', 'lifetime', 3, 'Code VIP à vie')
ON CONFLICT (code) DO NOTHING;

-- Code illimité pour tests (pas de limite d'utilisation)
INSERT INTO gift_codes (code, code_type, max_uses, notes)
VALUES ('AYNA-DEV-UNLIMITED', '1_month', NULL, 'Code dev illimité pour tests')
ON CONFLICT (code) DO NOTHING;
