# 🔧 TROUBLESHOOTING - Edge Function Ollama

**Date:** 2025-01-27  
**Version:** 1.0  
**Statut:** 🔧 **GUIDE DE DIAGNOSTIC**

---

## 📋 PROBLÈME

Erreur: `[aiAnalyticsAgent] Erreur génération analyse: [Error: Erreur serveur interne]`

---

## 🔍 DIAGNOSTIC

### 1. Vérifier les logs Supabase Edge Function

**Étapes:**
1. Allez sur [https://app.supabase.com](https://app.supabase.com)
2. Sélectionnez votre projet
3. Allez dans **Edge Functions** > **llama-proxy-ollama-cloud** > **Logs**
4. Vérifiez les erreurs récentes

**Erreurs possibles:**
- `OLLAMA_API_KEY non configurée` → Configurer le secret
- `Erreur Ollama: 401` → Clé API invalide
- `Erreur Ollama: 404` → URL incorrecte
- `Erreur Ollama: 500` → Problème côté Ollama

---

### 2. Vérifier la configuration des secrets

```bash
# Lister tous les secrets
supabase secrets list

# Vérifier que OLLAMA_API_KEY existe
# Si non, la configurer:
supabase secrets set OLLAMA_API_KEY=votre_clé_ollama
```

**Votre clé:** `20f0b0c8dec5448d89009314dd9ece54.Ksm70X_NMKEb4hy7_LlSORWa`

---

### 3. Vérifier l'URL Ollama

**Problème possible:** L'URL `https://api.ollama.ai/v1/chat` pourrait être incorrecte.

**Solutions:**
1. **Ollama Cloud:** `https://ollama.com/api/chat` ✅ **CORRECT**
2. **Ollama local:** `http://localhost:11434/api/chat`
3. **Ollama personnalisé:** Vérifier `OLLAMA_HOST` dans Supabase Secrets

**⚠️ IMPORTANT:** L'URL `https://api.ollama.com` n'existe pas ! Utilisez `https://ollama.com/api/chat`.

**Action:**
```bash
# Configurer OLLAMA_HOST (optionnel, par défaut: https://ollama.com)
supabase secrets set OLLAMA_HOST=https://ollama.com
```

---

### 4. Vérifier le format de la requête

**Format attendu par Ollama:**
```json
{
  "model": "llama3.2",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "stream": false
}
```

**Format de réponse Ollama:**
```json
{
  "choices": [{
    "message": {
      "content": "..."
    }
  }]
}
```

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. ✅ Amélioration du logging

**Fichier modifié:** `application/supabase/functions/llama-proxy-ollama-cloud/index.ts`

**Changements:**
- ✅ Logs détaillés pour diagnostic
- ✅ Gestion de plusieurs formats de réponse Ollama
- ✅ Messages d'erreur plus informatifs

---

### 2. ✅ Support OLLAMA_HOST

**Changement:**
- ✅ Support de la variable `OLLAMA_HOST` depuis Supabase Secrets
- ✅ Fallback vers `https://ollama.com` si non configuré (corrigé - `api.ollama.com` n'existe pas)
- ✅ Endpoint corrigé: `/api/chat` au lieu de `/v1/chat`

---

## 🔧 ACTIONS REQUISES

### 1. Configurer les secrets Supabase

```bash
# Configurer la clé API Ollama
supabase secrets set OLLAMA_API_KEY=20f0b0c8dec5448d89009314dd9ece54.Ksm70X_NMKEb4hy7_LlSORWa

# Configurer l'URL Ollama (si différente)
supabase secrets set OLLAMA_HOST=https://api.ollama.com
```

---

### 2. Redéployer l'Edge Function

```bash
supabase functions deploy llama-proxy-ollama-cloud
```

---

### 3. Vérifier les logs

Après le redéploiement, vérifier les logs Supabase pour voir l'erreur exacte.

---

## 🔍 TESTS

### Test manuel de l'Edge Function

```bash
curl -X POST https://ctupecolapegiogvmwxz.supabase.co/functions/v1/llama-proxy-ollama-cloud \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

**Résultat attendu:**
```json
{
  "response": "Réponse d'Ollama..."
}
```

---

## ⚠️ ERREURS COURANTES

### Erreur 1: "OLLAMA_API_KEY non configurée"

**Solution:**
```bash
supabase secrets set OLLAMA_API_KEY=votre_clé
```

---

### Erreur 2: "Erreur Ollama: 401"

**Cause:** Clé API invalide ou expirée

**Solution:** Vérifier que la clé API est correcte et active.

---

### Erreur 3: "Erreur Ollama: 404"

**Cause:** URL incorrecte

**Solution:** Vérifier `OLLAMA_HOST` ou utiliser `https://api.ollama.com`.

---

### Erreur 4: "Réponse vide d'Ollama Cloud"

**Cause:** Format de réponse inattendu

**Solution:** L'Edge Function gère maintenant plusieurs formats de réponse.

---

## ✅ CONCLUSION

**Actions requises:**
1. ⏳ Configurer `OLLAMA_API_KEY` dans Supabase Secrets
2. ⏳ (Optionnel) Configurer `OLLAMA_HOST` si différent
3. ⏳ Redéployer l'Edge Function
4. ⏳ Vérifier les logs Supabase

**Après ces actions, l'erreur devrait être résolue.**

---

**Dernière mise à jour:** 2025-01-27

