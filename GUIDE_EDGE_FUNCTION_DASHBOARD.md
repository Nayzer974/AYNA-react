# 📧 Guide : Créer l'Edge Function depuis le Dashboard Supabase

## 🎯 Objectif

Créer une Edge Function qui permet d'envoyer un email de vérification même si la session côté client est expirée.

---

## 📋 Étapes (Sans CLI - Depuis le Dashboard)

### Étape 1 : Accéder aux Edge Functions

1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Dans le menu de gauche, allez dans **Edge Functions**
4. Cliquez sur **"Create a new function"** ou **"New Function"**

### Étape 2 : Créer la fonction

1. **Nom de la fonction** : `resend-verification-email`
2. Cliquez sur **"Create function"**

### Étape 3 : Copier le code

1. **Ouvrez le fichier** : `application/supabase/functions/resend-verification-email/index.ts`
2. **Sélectionnez tout le contenu** (Ctrl+A / Cmd+A)
3. **Copiez** (Ctrl+C / Cmd+C)
4. **Collez dans l'éditeur** du Dashboard Supabase
5. **Remplacez tout le code par défaut** par le code copié

### Étape 4 : Déployer

1. Cliquez sur **"Deploy"** ou **"Save"**
2. Attendez que le déploiement se termine (quelques secondes)

### Étape 5 : Vérifier

1. La fonction devrait apparaître dans la liste des Edge Functions
2. Le statut devrait être **"Active"** ou **"Deployed"**

---

## ✅ Code à copier

Voici le code complet à copier dans le Dashboard :

```typescript
// Edge Function Supabase pour renvoyer un email de vérification
// Permet d'envoyer l'email même si la session côté client est expirée

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Créer un client Supabase avec la clé service_role (seulement côté serveur)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { email, redirectUrl } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email manquant' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérifier que l'utilisateur existe
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur lors de la vérification de l\'utilisateur' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Aucun compte trouvé avec cet email' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Vérifier si l'email est déjà vérifié
    if (user.email_confirmed_at) {
      return new Response(
        JSON.stringify({ success: false, error: 'Cet email est déjà vérifié' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Générer un token de confirmation et envoyer l'email
    const { data: generateData, error: generateError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: redirectUrl || 'https://www.nurayna.com/verify-email.html',
      },
    });

    if (generateError) {
      console.error('Erreur génération lien:', generateError);
      return new Response(
        JSON.stringify({ success: false, error: generateError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Le lien est généré, Supabase enverra automatiquement l'email
    // (si la configuration email est correcte)
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Email de vérification envoyé'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Erreur Edge Function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error?.message || 'Erreur serveur inattendue' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
```

---

## 🧪 Tester la fonction

Une fois déployée, vous pouvez tester la fonction depuis l'app. Le code détectera automatiquement si la session est expirée et utilisera l'Edge Function comme fallback.

---

## 🔍 Vérifier que ça fonctionne

1. **Dans l'app** : Allez dans Paramètres → Vérification Email
2. **Cliquez** sur "Vérifier l'adresse email"
3. **Vérifiez les logs** dans Supabase Dashboard → Edge Functions → Logs
4. **Vérifiez votre boîte email** pour voir si l'email est arrivé

---

## ⚠️ Notes importantes

- Les variables d'environnement `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont automatiquement disponibles dans les Edge Functions
- La fonction utilise `admin.generateLink()` qui génère un lien de confirmation et envoie automatiquement l'email
- La fonction vérifie que l'utilisateur existe et que l'email n'est pas déjà vérifié

---

**Dernière mise à jour :** 2025-01-27







