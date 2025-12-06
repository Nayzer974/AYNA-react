-- Script pour diagnostiquer et corriger l'erreur de contrainte de clé étrangère
-- sur la table dhikr_sessions

-- ============================================
-- 1. VÉRIFIER LA CONTRAINTE EXISTANTE
-- ============================================
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_type
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'dhikr_sessions'
    AND kcu.column_name = 'created_by';

-- ============================================
-- 2. SUPPRIMER LES CONTRAINTES MAL NOMMÉES
-- ============================================
DO $$ 
DECLARE
    constraint_name_var TEXT;
BEGIN
    -- Trouver toutes les contraintes de clé étrangère sur created_by
    FOR constraint_name_var IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.table_schema = 'public'
        AND tc.table_name = 'dhikr_sessions'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND EXISTS (
            SELECT 1
            FROM information_schema.key_column_usage AS kcu
            WHERE kcu.constraint_name = tc.constraint_name
            AND kcu.column_name = 'created_by'
        )
        AND (
            -- Si le nom contient une faute de frappe
            tc.constraint_name LIKE '%dhikt%' 
            OR tc.constraint_name NOT LIKE '%dhikr%'
        )
    LOOP
        EXECUTE 'ALTER TABLE public.dhikr_sessions DROP CONSTRAINT IF EXISTS ' || quote_ident(constraint_name_var);
        RAISE NOTICE 'Contrainte supprimée: %', constraint_name_var;
    END LOOP;
END $$;

-- ============================================
-- 3. SUPPRIMER LES ENREGISTREMENTS ORPHELINS
-- ============================================
-- Supprimer les sessions dont created_by n'existe pas dans auth.users
DELETE FROM public.dhikr_session_participants
WHERE session_id IN (
    SELECT id FROM public.dhikr_sessions
    WHERE created_by NOT IN (SELECT id FROM auth.users)
);

DELETE FROM public.dhikr_sessions
WHERE created_by NOT IN (SELECT id FROM auth.users);

-- ============================================
-- 4. CRÉER/CRÉER LA CONTRAINTE CORRECTEMENT
-- ============================================
-- Supprimer la contrainte existante si elle existe
ALTER TABLE public.dhikr_sessions
DROP CONSTRAINT IF EXISTS dhikr_sessions_created_by_fkey;

ALTER TABLE public.dhikr_sessions
DROP CONSTRAINT IF EXISTS dhikt_sessions_created_by_fkey;

-- Créer la contrainte correctement
ALTER TABLE public.dhikr_sessions
ADD CONSTRAINT dhikr_sessions_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- ============================================
-- 5. VÉRIFIER QUE LA CONTRAINTE EST CRÉÉE
-- ============================================
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'dhikr_sessions'
    AND kcu.column_name = 'created_by';

-- ============================================
-- 6. VÉRIFIER QUE LA FONCTION RPC EXISTE
-- ============================================
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_dhikr_session';


