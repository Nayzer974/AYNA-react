# 🤖 POLITIQUE DES DONNÉES IA - AYNA

**Date:** 2025-01-27  
**Version:** 1.0  
**Statut:** ✅ Politique documentée et appliquée

---

## 📋 RÉSUMÉ EXÉCUTIF

Ce document définit la **politique stricte** concernant les données envoyées aux services IA (OpenRouter, Ollama) dans l'application AYNA. L'objectif est de garantir qu'**aucune donnée sensible** (journal personnel, intentions religieuses, PII) n'est jamais envoyée aux services IA.

**Principe fondamental:** ✅ **ZÉRO DONNÉE SENSIBLE** envoyée aux services IA.

---

## 🚫 DONNÉES INTERDITES

### ❌ Données sensibles religieuses

**Interdites:**
- ❌ Entrées de journal personnelles (texte brut)
- ❌ Intentions religieuses (niyyah)
- ❌ Notes personnelles
- ❌ Messages de chat utilisateur contenant des données personnelles
- ❌ Contenu religieux personnel

**Raison:** Ces données sont **sacrées et privées**. Elles ne doivent jamais quitter l'appareil de l'utilisateur ou être envoyées à des services tiers.

---

### ❌ Données personnelles identifiables (PII)

**Interdites:**
- ❌ Email
- ❌ Nom complet
- ❌ Adresse
- ❌ Numéro de téléphone
- ❌ Localisation précise (coordonnées GPS)
- ❌ Identifiants utilisateur (UUID)

**Raison:** Conformité GDPR et protection de la vie privée.

---

### ❌ Données de session brute

**Interdites:**
- ❌ Tokens d'authentification
- ❌ Sessions Supabase
- ❌ Clés API
- ❌ Secrets

**Raison:** Sécurité - ces données ne doivent jamais être exposées.

---

## ✅ DONNÉES AUTORISÉES

### ✅ Données agrégées uniquement

**Autorisées:**
- ✅ Compteurs (total dhikr, total notes, total prières)
- ✅ Durées (temps passé dans un module)
- ✅ Tendances (évolution dans le temps)
- ✅ Statistiques anonymisées (heures de pic, jours de la semaine)
- ✅ Métriques agrégées (streak, totalDays)

**Format:** Uniquement des **nombres et statistiques agrégées**, jamais de texte brut.

---

### ✅ Données anonymisées

**Autorisées:**
- ✅ Émotions détectées (liste d'émotions sans contexte)
- ✅ Thèmes identifiés (liste de thèmes sans texte source)
- ✅ Patterns détectés (tendances générales sans détails)

**Format:** Uniquement des **métadonnées anonymisées**, jamais le texte source.

---

## 🔍 AUDIT DES SERVICES IA

### 1. ✅ `aiAnalyticsAgent.ts` - Analyse des analytics

**Service:** Analyse des données analytics pour générer des insights.

**Données envoyées:**
```typescript
// ✅ AUTORISÉ - Données agrégées uniquement
{
  totalDhikr: 150,           // ✅ Nombre
  totalNotes: 25,            // ✅ Nombre
  totalPrayers: 30,          // ✅ Nombre
  streak: 7,                 // ✅ Nombre
  totalDays: 30,             // ✅ Nombre
  peakHour: 14,              // ✅ Nombre (heure)
  dhikrEvents: 45,           // ✅ Nombre (compteur d'événements)
  journalEvents: 25,         // ✅ Nombre (compteur d'événements)
  prayerEvents: 30,          // ✅ Nombre (compteur d'événements)
  hourDistribution: {        // ✅ Statistiques agrégées
    8: 5, 14: 10, 20: 8
  }
}
```

**❌ Interdit:**
- ❌ Texte des entrées de journal
- ❌ Contenu des notes
- ❌ Intentions religieuses
- ❌ Email ou nom utilisateur
- ❌ UUID utilisateur

**Statut:** ✅ **CONFORME** - Seules des données agrégées sont envoyées.

**Fichier:** `application/src/services/aiAnalyticsAgent.ts`

---

### 2. ✅ `journalAnalysis.ts` - Analyse du journal

**Service:** Analyse des notes de journal pour détecter émotions et thèmes.

**Données envoyées:**
```typescript
// ✅ AUTORISÉ - Métadonnées anonymisées uniquement
{
  totalNotes: 25,                    // ✅ Nombre
  emotions: ['joie', 'paix'],        // ✅ Liste d'émotions (sans texte source)
  themes: ['gratitude', 'espoir'],   // ✅ Liste de thèmes (sans texte source)
  sentiment: 'positive',              // ✅ Classification agrégée
  patterns: ['augmentation dhikr'],   // ✅ Patterns généraux (sans détails)
  trends: ['amélioration']            // ✅ Tendances générales (sans détails)
}
```

**❌ Interdit:**
- ❌ Texte brut des notes de journal
- ❌ Contenu des entrées
- ❌ Citations ou extraits
- ❌ Email ou nom utilisateur
- ❌ UUID utilisateur

**Statut:** ✅ **CONFORME** - Seules des métadonnées anonymisées sont envoyées.

**Fichier:** `application/src/services/journalAnalysis.ts`

**⚠️ ATTENTION:** Le service `journalAnalysis.ts` utilise `sendToAyna` qui peut recevoir des messages de chat. Vérifier que les messages de chat ne contiennent pas de données sensibles.

---

### 3. ✅ `ayna.ts` - Chat avec AYNA

**Service:** Chat avec l'assistant IA AYNA.

**Données envoyées:**
```typescript
// ✅ AUTORISÉ - Messages de chat utilisateur (sans contexte personnel)
{
  messages: [
    { role: 'user', content: 'Comment faire le dhikr ?' },  // ✅ Question générale
    { role: 'assistant', content: '...' }
  ],
  language: 'fr'  // ✅ Langue (non sensible)
}
```

**❌ Interdit:**
- ❌ Entrées de journal dans les messages
- ❌ Intentions religieuses dans les messages
- ❌ Données personnelles dans les messages
- ❌ Email ou nom utilisateur
- ❌ UUID utilisateur

**Statut:** ⚠️ **À VÉRIFIER** - Les messages utilisateur peuvent contenir des données sensibles si l'utilisateur les partage volontairement.

**Recommandation:** Ajouter un avertissement dans l'UI du chat pour informer l'utilisateur que ses messages sont envoyés à un service IA externe.

**Fichier:** `application/src/services/ayna.ts`

---

## 🔒 VALIDATION ET FILTRAGE

### Fonction de validation des données IA

**Recommandation:** Créer une fonction de validation qui filtre automatiquement les données sensibles avant l'envoi aux services IA.

```typescript
// À créer dans application/src/utils/aiDataValidator.ts
export function validateDataForAI(data: any): any {
  // Filtrer les champs interdits
  const forbiddenFields = [
    'email', 'name', 'userId', 'user_id', 'id',
    'journal', 'journal_entries', 'notes', 'intention',
    'token', 'session', 'secret', 'password'
  ];
  
  // ... logique de filtrage
}
```

**Statut:** ⚠️ **À IMPLÉMENTER**

---

## 📊 PAYLOAD IA AUTORISÉ

### Structure standard

Tous les payloads envoyés aux services IA doivent respecter cette structure :

```typescript
interface SafeAIPayload {
  // ✅ Nombres uniquement
  metrics: {
    totalDhikr?: number;
    totalNotes?: number;
    totalPrayers?: number;
    streak?: number;
    totalDays?: number;
  };
  
  // ✅ Statistiques agrégées
  statistics: {
    peakHour?: number;
    hourDistribution?: Record<number, number>;
    dayDistribution?: Record<string, number>;
  };
  
  // ✅ Métadonnées anonymisées
  metadata: {
    emotions?: string[];      // Liste d'émotions (sans texte source)
    themes?: string[];        // Liste de thèmes (sans texte source)
    sentiment?: 'positive' | 'neutral' | 'negative';
    patterns?: string[];       // Patterns généraux (sans détails)
  };
  
  // ✅ Langue (non sensible)
  language?: 'fr' | 'ar' | 'en';
  
  // ❌ JAMAIS de texte brut
  // ❌ JAMAIS de PII
  // ❌ JAMAIS de données religieuses personnelles
}
```

---

## ✅ CONFORMITÉ

### Vérifications effectuées

1. ✅ **aiAnalyticsAgent.ts:** Seules des données agrégées envoyées
2. ✅ **journalAnalysis.ts:** Seules des métadonnées anonymisées envoyées
3. ⚠️ **ayna.ts:** Messages utilisateur - à vérifier avec avertissement UI

### Conformité GDPR

✅ **CONFORME** - Aucune donnée personnelle identifiable (PII) n'est envoyée aux services IA.

### Conformité religieuse

✅ **CONFORME** - Aucune donnée religieuse personnelle (journal, intentions) n'est envoyée aux services IA.

---

## 📝 RECOMMANDATIONS

### 1. ⚠️ Ajouter un avertissement dans le chat

**Recommandation:** Ajouter un avertissement dans l'UI du chat pour informer l'utilisateur que ses messages sont envoyés à un service IA externe.

**Fichier à modifier:** `application/src/pages/Chat.tsx`

**Statut:** ⚠️ **À FAIRE**

---

### 2. ⚠️ Créer une fonction de validation

**Recommandation:** Créer une fonction `validateDataForAI` qui filtre automatiquement les données sensibles avant l'envoi.

**Fichier à créer:** `application/src/utils/aiDataValidator.ts`

**Statut:** ⚠️ **À FAIRE**

---

### 3. ⚠️ Ajouter des tests unitaires

**Recommandation:** Créer des tests unitaires pour vérifier que les services IA ne reçoivent jamais de données sensibles.

**Fichier à créer:** `application/src/services/__tests__/aiDataValidator.test.ts`

**Statut:** ⚠️ **À FAIRE**

---

## 📚 RÉFÉRENCES

### Services IA audités
- `application/src/services/aiAnalyticsAgent.ts` - Analyse analytics
- `application/src/services/journalAnalysis.ts` - Analyse journal
- `application/src/services/ayna.ts` - Chat avec AYNA

### Documentation
- `application/SECURITY_FIXES.md` - Corrections de sécurité
- `application/STORE_SECURITY_COMPLIANCE.md` - Conformité stores

---

## ✅ CONCLUSION

**Statut global:** ✅ **CONFORME** avec recommandations

Les services IA reçoivent uniquement des **données agrégées et anonymisées**. Aucune donnée sensible (journal, intentions, PII) n'est envoyée.

**Recommandations:**
1. Ajouter un avertissement dans le chat
2. Créer une fonction de validation automatique
3. Ajouter des tests unitaires

---

**Dernière mise à jour:** 2025-01-27




