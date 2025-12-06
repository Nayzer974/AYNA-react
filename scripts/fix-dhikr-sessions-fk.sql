-- Script pour corriger la contrainte de clé étrangère sur dhikr_sessions.created_by
-- Ce script vérifie et corrige les problèmes de contrainte de clé étrangère

-- 1. Vérifier les contraintes existantes
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

-- 2. Supprimer la contrainte existante si elle existe et qu'elle est mal nommée
DO $$ 
BEGIN
    -- Supprimer la contrainte si elle existe avec un nom incorrect
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'dhikt_sessions_created_by_fkey'
        AND table_name = 'dhikr_sessions'
    ) THEN
        ALTER TABLE public.dhikr_sessions 
        DROP CONSTRAINT IF EXISTS dhikt_sessions_created_by_fkey;
    END IF;
END $$;

-- 3. Supprimer les enregistrements orphelins (sessions avec created_by qui n'existe pas dans auth.users)
DELETE FROM public.dhikr_sessions
WHERE created_by NOT IN (SELECT id FROM auth.users);

-- 4. Recréer la contrainte de clé étrangère correctement
ALTER TABLE public.dhikr_sessions
DROP CONSTRAINT IF EXISTS dhikr_sessions_created_by_fkey;

ALTER TABLE public.dhikr_sessions
ADD CONSTRAINT dhikr_sessions_created_by_fkey
FOREIGN KEY (created_by)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 5. Vérifier que la contrainte est bien créée
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


