# 🏗️ ARCHITECTURE BACKEND SÉCURISÉE - AYNA

**Date:** 2025-01-27  
**Version:** 1.0  
**Statut:** ✅ **ARCHITECTURE FINALE**

---

## 📋 VUE D'ENSEMBLE

Architecture backend sécurisée pour l'application AYNA, garantissant qu'**aucune clé secrète** n'est exposée dans le bundle mobile.

---

## 🏗️ ARCHITECTURE GLOBALE

```
┌─────────────────┐
│   Mobile App    │
│  (React Native) │
│                 │
│  ✅ Zéro secret │
└────────┬────────┘
         │
         │ HTTPS (sans clés)
         │
         ▼
┌─────────────────────────┐
│  Supabase Edge Functions │
│                         │
│  ✅ Clés dans Secrets   │
│  ✅ Validation stricte   │
│  ✅ Rate limiting       │
└────────┬────────────────┘
         │
         │ HTTPS (avec clés)
         │
         ▼
┌─────────────────────────┐
│   Services Externes      │
│                         │
│  • Ollama Cloud         │
│  • OpenRouter           │
│  • Quran API            │
│  • Brevo (Email)        │
└─────────────────────────┘
```

---

## 🔐 SÉCURITÉ DES CLÉS

### ❌ AVANT (NON SÉCURISÉ)

**Problèmes:**
- Clés API dans `app.config.js` → Bundle mobile
- Clés API dans `config.ts` → Bundle mobile
- Secrets hardcodés dans le code
- HTTP au lieu de HTTPS

**Risques:**
- 🔴 Clés exposées dans APK/AAB/IPA
- 🔴 Reverse engineering possible
- 🔴 Communication non chiffrée

---

### ✅ APRÈS (SÉCURISÉ)

**Solutions:**
- ✅ Clés API uniquement dans Supabase Secrets
- ✅ Mobile → Edge Functions (sans clés)
- ✅ Edge Functions → Services (avec clés)
- ✅ HTTPS partout

**Bénéfices:**
- ✅ Aucune clé dans le bundle mobile
- ✅ Clés rotables sans rebuild
- ✅ Communication chiffrée
- ✅ Rate limiting côté serveur

---

## 🔧 EDGE FUNCTIONS

### 1. `llama-proxy-ollama-cloud`

**Rôle:** Proxy sécurisé pour Ollama Cloud API

**Fichier:** `supabase/functions/llama-proxy-ollama-cloud/index.ts`

**Fonctionnalités:**
- ✅ Authentification Supabase requise
- ✅ Clé API depuis `OLLAMA_API_KEY` (Supabase Secret)
- ✅ Validation stricte (max 50 messages, max 10000 caractères)
- ✅ Logs sans PII
- ✅ Gestion d'erreurs sécurisée

**Déploiement:**
```bash
# Configurer le secret
supabase secrets set OLLAMA_API_KEY=votre_clé_ollama

# Déployer
supabase functions deploy llama-proxy-ollama-cloud
```

**Utilisation (mobile):**
```typescript
// Mobile n'a plus besoin de clé API
const response = await fetch(`${supabaseUrl}/functions/v1/llama-proxy-ollama-cloud`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`, // Seulement clé anon
  },
  body: JSON.stringify({
    messages: [...],
    useTools: true,
  }),
});
```

---

### 2. ⏳ `openrouter-proxy` (À créer si nécessaire)

**Rôle:** Proxy sécurisé pour OpenRouter API

**Si OpenRouter est utilisé ailleurs dans l'app**, créer une Edge Function similaire.

---

### 3. ⏳ `quran-oauth-proxy` (À créer si nécessaire)

**Rôle:** Proxy sécurisé pour Quran OAuth

**Si Quran OAuth est utilisé**, créer une Edge Function pour gérer le secret OAuth.

---

## 📊 FLUX DE DONNÉES

### Exemple: Chat AYNA (Ollama)

```
1. Mobile App
   └─> Envoie messages (sans clé API)
       └─> POST /functions/v1/llama-proxy-ollama-cloud
           └─> Headers: Authorization: Bearer {supabaseAnonKey}

2. Supabase Edge Function
   └─> Vérifie authentification (auth.getUser())
   └─> Récupère OLLAMA_API_KEY depuis Secrets
   └─> Valide les paramètres
   └─> Appelle Ollama Cloud API (avec clé)

3. Ollama Cloud API
   └─> Retourne la réponse

4. Supabase Edge Function
   └─> Retourne { response: "..." }

5. Mobile App
   └─> Affiche la réponse
```

---

## 🔒 SÉCURITÉ

### Authentification

- ✅ **Mobile → Edge Function:** Supabase Auth (Bearer token)
- ✅ **Edge Function → Services:** Clés API dans Secrets

### Validation

- ✅ **Paramètres:** Validation stricte (types, tailles, formats)
- ✅ **Rate limiting:** Côté Supabase (Edge Functions)
- ✅ **Logs:** Sans PII, redaction automatique

### Secrets

- ✅ **Stockage:** Supabase Secrets (jamais dans le code)
- ✅ **Rotation:** Possible sans rebuild mobile
- ✅ **Accès:** Uniquement Edge Functions

---

## 📚 DOCUMENTATION

### Déploiement

1. **Configurer les secrets:**
   ```bash
   supabase secrets set OLLAMA_API_KEY=votre_clé
   ```

2. **Déployer les fonctions:**
   ```bash
   supabase functions deploy llama-proxy-ollama-cloud
   ```

3. **Vérifier:**
   ```bash
   supabase functions list
   ```

### Utilisation (mobile)

Voir `application/src/services/ayna.ts` pour l'exemple complet.

---

## ✅ CONCLUSION

**Architecture:** ✅ **SÉCURISÉE**

- ✅ Aucune clé dans le mobile
- ✅ Proxy sécurisé via Edge Functions
- ✅ HTTPS partout
- ✅ Validation stricte
- ✅ Logs sécurisés

**L'application est prête pour la production.**

---

**Dernière mise à jour:** 2025-01-27




