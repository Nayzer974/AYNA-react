-- Script pour résoudre le conflit entre deux fonctions create_dhikr_session
-- Il y a deux versions de la fonction avec des signatures différentes

-- ============================================
-- 1. LISTER TOUTES LES FONCTIONS DUPLIQUÉES
-- ============================================
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments,
    p.pronargs AS num_parameters,
    p.proargnames AS parameter_names
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_dhikr_session'
ORDER BY p.pronargs;

-- ============================================
-- 2. SUPPRIMER L'ANCIENNE FONCTION (3 paramètres)
-- ============================================
-- Cette fonction n'a pas le paramètre session_type
DROP FUNCTION IF EXISTS public.create_dhikr_session(TEXT, INTEGER, INTEGER);

-- ============================================
-- 3. VÉRIFIER QUE SEULE LA NOUVELLE FONCTION EXISTE
-- ============================================
SELECT 
    p.proname AS function_name,
    pg_get_function_identity_arguments(p.oid) AS function_arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'create_dhikr_session';

-- ============================================
-- 4. VÉRIFIER QUE LA TABLE A LA COLONNE session_type
-- ============================================
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'dhikr_sessions'
AND column_name = 'session_type';

-- Si la colonne n'existe pas, l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'dhikr_sessions' 
        AND column_name = 'session_type'
    ) THEN
        ALTER TABLE public.dhikr_sessions 
        ADD COLUMN session_type TEXT DEFAULT 'community' NOT NULL;
        
        -- Créer un index sur session_type si nécessaire
        CREATE INDEX IF NOT EXISTS idx_dhikr_sessions_session_type 
        ON public.dhikr_sessions(session_type);
        
        RAISE NOTICE 'Colonne session_type ajoutée à la table dhikr_sessions';
    ELSE
        RAISE NOTICE 'La colonne session_type existe déjà';
    END IF;
END $$;


