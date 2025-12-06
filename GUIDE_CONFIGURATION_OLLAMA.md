# Guide de Configuration Ollama pour AYNA Mobile

## Vue d'ensemble

AYNA utilise **Ollama Cloud** via une **Supabase Edge Function** comme proxy. Les appels directs à Ollama Cloud depuis le frontend sont bloqués par CORS, c'est pourquoi nous utilisons Supabase Edge Function.

## Configuration requise

### 1. Variables d'environnement

Dans votre fichier `.env`, vous devez avoir :

```env
# Supabase (obligatoire pour Ollama)
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon

# Ollama Cloud API Key (optionnel dans .env, doit être configuré dans Supabase)
EXPO_PUBLIC_OLLAMA_API_KEY=votre_clé_ollama
```

### 2. Configuration Supabase Edge Function

Vous devez déployer une Edge Function dans Supabase qui servira de proxy vers Ollama Cloud.

#### Nom de la fonction
La fonction doit s'appeler : `llama-proxy-ollama-cloud`

#### Configuration des secrets Supabase

Dans votre projet Supabase, configurez le secret `OLLAMA_API_KEY` :

```bash
supabase secrets set OLLAMA_API_KEY=votre_clé_ollama_cloud
```

#### Code de la Edge Function

La fonction doit accepter des requêtes POST avec :
- `messages`: Array de messages au format Ollama
- `useTools`: Boolean (optionnel)

Et retourner :
```json
{
  "response": "Réponse d'Ollama"
}
```

### 3. Vérification de la configuration

Le service AYNA affichera dans la console :
- `[AYNA] Configuration Ollama Cloud uniquement:` avec l'état de la configuration
- `[AYNA] ✅ Utilisation de Supabase Edge Function:` si tout est correct

## Erreurs courantes

### "Configuration Supabase requise"
- Vérifiez que `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` sont définis dans `.env`
- Redémarrez Expo avec `npx expo start --clear`

### "Erreur Supabase Edge Function"
- Vérifiez que la fonction `llama-proxy-ollama-cloud` est déployée
- Vérifiez que le secret `OLLAMA_API_KEY` est configuré dans Supabase
- Vérifiez votre connexion internet

### "Erreur de connexion à Supabase Edge Function"
- Vérifiez que la fonction est accessible
- Vérifiez les logs de la fonction dans Supabase Dashboard
- Vérifiez que votre connexion internet fonctionne

## Notes importantes

1. **Ollama Cloud uniquement** : L'application utilise exclusivement Ollama Cloud, pas d'instance locale
2. **CORS** : Les appels directs à Ollama Cloud sont bloqués par CORS, d'où l'utilisation de Supabase Edge Function
3. **Prompt système** : Le prompt système AYNA est automatiquement injecté au début de chaque conversation
4. **Cache** : Le prompt système n'est envoyé qu'une seule fois pour optimiser les performances

## Test de la configuration

Pour tester si tout fonctionne :

1. Ouvrez l'application
2. Allez dans l'onglet "AYNA" (Chat)
3. Envoyez un message de test
4. Vérifiez la console pour les logs de configuration
5. Si une erreur apparaît, consultez les messages d'erreur ci-dessus


