-- ============================================
-- SCRIPT DE TEST POUR LES POLICIES RLS
-- ============================================
-- Date : 2025-01-27
-- Expert Sécurité : Agent IA Sécurité AYNA
--
-- ⚠️ IMPORTANT : Exécuter ce script dans Supabase SQL Editor
-- Ce script teste toutes les policies RLS pour vérifier qu'elles fonctionnent correctement
-- ============================================

-- ============================================
-- FONCTIONS DE TEST
-- ============================================

-- Fonction pour tester une policy SELECT
CREATE OR REPLACE FUNCTION test_select_policy(
  table_name TEXT,
  policy_name TEXT,
  test_user_id UUID,
  expected_count INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_count INTEGER;
  v_result TEXT;
BEGIN
  -- Simuler l'utilisateur
  PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
  
  -- Compter les lignes accessibles
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name) INTO v_count;
  
  -- Vérifier le résultat
  IF v_count = expected_count THEN
    v_result := format('✅ PASS: %s.%s - Count: %s (expected: %s)', table_name, policy_name, v_count, expected_count);
  ELSE
    v_result := format('❌ FAIL: %s.%s - Count: %s (expected: %s)', table_name, policy_name, v_count, expected_count);
  END IF;
  
  -- Réinitialiser
  PERFORM set_config('request.jwt.claim.sub', '', true);
  
  RETURN v_result;
END;
$$;

-- ============================================
-- TESTS POUR LA TABLE PROFILES
-- ============================================

-- Test 1 : Un utilisateur peut voir son propre profil
DO $$
DECLARE
  test_user_id UUID;
  result TEXT;
BEGIN
  -- Créer un utilisateur de test
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (gen_random_uuid(), 'test_user@example.com', crypt('password', gen_salt('bf')), NOW())
  ON CONFLICT DO NOTHING
  RETURNING id INTO test_user_id;
  
  IF test_user_id IS NULL THEN
    SELECT id INTO test_user_id FROM auth.users WHERE email = 'test_user@example.com';
  END IF;
  
  -- Créer un profil pour cet utilisateur
  INSERT INTO profiles (id, name, email)
  VALUES (test_user_id, 'Test User', 'test_user@example.com')
  ON CONFLICT (id) DO UPDATE SET name = 'Test User';
  
  -- Tester la policy SELECT
  PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
  
  -- Vérifier que l'utilisateur peut voir son propre profil
  IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id) THEN
    RAISE NOTICE '✅ PASS: Users can view own profile';
  ELSE
    RAISE NOTICE '❌ FAIL: Users can view own profile';
  END IF;
  
  PERFORM set_config('request.jwt.claim.sub', '', true);
END $$;

-- Test 2 : Un utilisateur ne peut pas modifier is_admin
DO $$
DECLARE
  test_user_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test_user@example.com';
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️ SKIP: Test user not found';
    RETURN;
  END IF;
  
  PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
  
  -- Tenter de modifier is_admin (devrait échouer)
  BEGIN
    UPDATE profiles SET is_admin = true WHERE id = test_user_id;
    RAISE NOTICE '❌ FAIL: User was able to set is_admin = true';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ PASS: User cannot modify is_admin';
  END;
  
  PERFORM set_config('request.jwt.claim.sub', '', true);
END $$;

-- ============================================
-- TESTS POUR LA TABLE COMMUNITY_POSTS
-- ============================================

-- Test 3 : Un utilisateur banni ne peut pas créer de post
DO $$
DECLARE
  test_user_id UUID;
  ban_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test_user@example.com';
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️ SKIP: Test user not found';
    RETURN;
  END IF;
  
  -- Bannir l'utilisateur
  INSERT INTO user_bans (user_id, user_email, ban_type, banned_by, reason)
  VALUES (test_user_id, 'test_user@example.com', 'temporary', test_user_id, 'Test ban')
  ON CONFLICT (user_id) DO UPDATE SET ban_type = 'temporary', expires_at = NOW() + INTERVAL '1 hour'
  RETURNING id INTO ban_id;
  
  PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
  
  -- Tenter de créer un post (devrait échouer)
  BEGIN
    INSERT INTO community_posts (user_id, user_name, text)
    VALUES (test_user_id, 'Test User', 'Test post');
    RAISE NOTICE '❌ FAIL: Banned user was able to create a post';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ PASS: Banned user cannot create posts';
  END;
  
  -- Nettoyer
  DELETE FROM user_bans WHERE id = ban_id;
  PERFORM set_config('request.jwt.claim.sub', '', true);
END $$;

-- ============================================
-- TESTS POUR LA TABLE DHIKR_SESSIONS
-- ============================================

-- Test 4 : Un utilisateur peut créer une session dhikr
DO $$
DECLARE
  test_user_id UUID;
  session_id UUID;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test_user@example.com';
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️ SKIP: Test user not found';
    RETURN;
  END IF;
  
  PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
  
  -- Tenter de créer une session via la fonction RPC
  -- Note: Utiliser create_dhikr_session si create_dhikr_session_secure n'existe pas
  BEGIN
    -- Essayer d'abord avec create_dhikr_session_secure
    BEGIN
      SELECT public.create_dhikr_session_secure(
        test_user_id,
        'SubhanAllah',
        100,
        10
      ) INTO session_id;
    EXCEPTION WHEN undefined_function THEN
      -- Fallback sur create_dhikr_session si la fonction sécurisée n'existe pas
      SELECT public.create_dhikr_session(
        test_user_id,
        'SubhanAllah',
        100,
        10
      ) INTO session_id;
    END;
    
    IF session_id IS NOT NULL THEN
      RAISE NOTICE '✅ PASS: User can create dhikr session';
      -- Nettoyer
      DELETE FROM dhikr_sessions WHERE id = session_id;
    ELSE
      RAISE NOTICE '❌ FAIL: User cannot create dhikr session';
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: Error creating dhikr session: %', SQLERRM;
  END;
  
  PERFORM set_config('request.jwt.claim.sub', '', true);
END $$;

-- ============================================
-- TESTS POUR LA TABLE KHALWA_SESSIONS
-- ============================================

-- Test 5 : Un utilisateur peut voir uniquement ses propres sessions
DO $$
DECLARE
  test_user_id UUID;
  other_user_id UUID;
  test_session_id UUID;
  other_session_id UUID;
  count_result INTEGER;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test_user@example.com';
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️ SKIP: Test user not found';
    RETURN;
  END IF;
  
  -- Créer un autre utilisateur
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at)
  VALUES (gen_random_uuid(), 'other_user@example.com', crypt('password', gen_salt('bf')), NOW())
  ON CONFLICT DO NOTHING
  RETURNING id INTO other_user_id;
  
  IF other_user_id IS NULL THEN
    SELECT id INTO other_user_id FROM auth.users WHERE email = 'other_user@example.com';
  END IF;
  
  -- Créer des sessions pour les deux utilisateurs
  -- ✅ Correction : Inclure toutes les colonnes NOT NULL requises
  INSERT INTO khalwa_sessions (
    user_id, 
    intention, 
    divine_name_id, 
    divine_name_arabic,
    divine_name_transliteration,
    sound_ambiance,
    breathing_type,
    duration_minutes
  )
  VALUES (
    test_user_id, 
    'Test intention', 
    'allah',
    'الله',
    'Allah',
    'desert',
    'libre',
    10.00
  )
  RETURNING id INTO test_session_id;
  
  INSERT INTO khalwa_sessions (
    user_id, 
    intention, 
    divine_name_id, 
    divine_name_arabic,
    divine_name_transliteration,
    sound_ambiance,
    breathing_type,
    duration_minutes
  )
  VALUES (
    other_user_id, 
    'Other intention', 
    'allah',
    'الله',
    'Allah',
    'desert',
    'libre',
    10.00
  )
  RETURNING id INTO other_session_id;
  
  -- Tester avec le premier utilisateur
  PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
  
  SELECT COUNT(*) INTO count_result
  FROM khalwa_sessions;
  
  IF count_result = 1 THEN
    RAISE NOTICE '✅ PASS: User can see only own khalwa sessions';
  ELSE
    RAISE NOTICE '❌ FAIL: User can see % sessions (expected: 1)', count_result;
  END IF;
  
  -- Nettoyer
  DELETE FROM khalwa_sessions WHERE id IN (test_session_id, other_session_id);
  PERFORM set_config('request.jwt.claim.sub', '', true);
END $$;

-- ============================================
-- TESTS POUR LA FONCTION check_user_is_admin
-- ============================================

-- Test 6 : La fonction admin ne peut être appelée que pour soi-même
DO $$
DECLARE
  test_user_id UUID;
  other_user_id UUID;
  result BOOLEAN;
BEGIN
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'test_user@example.com';
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE '⚠️ SKIP: Test user not found';
    RETURN;
  END IF;
  
  SELECT id INTO other_user_id FROM auth.users WHERE email = 'other_user@example.com';
  
  IF other_user_id IS NULL THEN
    RAISE NOTICE '⚠️ SKIP: Other user not found';
    RETURN;
  END IF;
  
  -- Tester avec le bon utilisateur (devrait fonctionner)
  PERFORM set_config('request.jwt.claim.sub', test_user_id::text, true);
  
  BEGIN
    SELECT public.check_user_is_admin(test_user_id) INTO result;
    RAISE NOTICE '✅ PASS: User can check own admin status';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ FAIL: Error checking own admin status: %', SQLERRM;
  END;
  
  -- Tester avec un autre utilisateur (devrait échouer)
  BEGIN
    SELECT public.check_user_is_admin(other_user_id) INTO result;
    RAISE NOTICE '❌ FAIL: User was able to check another user admin status';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '✅ PASS: User cannot check another user admin status';
  END;
  
  PERFORM set_config('request.jwt.claim.sub', '', true);
END $$;

-- ============================================
-- NETTOYAGE
-- ============================================

-- Supprimer les utilisateurs de test (optionnel)
-- ⚠️ Décommenter uniquement si vous voulez nettoyer après les tests
-- DELETE FROM profiles WHERE email IN ('test_user@example.com', 'other_user@example.com');
-- DELETE FROM auth.users WHERE email IN ('test_user@example.com', 'other_user@example.com');

-- ============================================
-- ✅ TESTS TERMINÉS
-- ============================================
-- 
-- Vérifiez les résultats dans les logs Supabase
-- Tous les tests doivent afficher ✅ PASS
-- ============================================

