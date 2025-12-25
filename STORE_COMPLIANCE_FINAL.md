# ✅ CONFORMITÉ STORES - CHECKLIST FINALE

**Date:** 27 janvier 2025  
**Application:** AYNA Mobile  
**Version:** 1.0.0

---

## 🍎 APPLE APP STORE

### Conformité Technique ✅
- [x] Permissions déclarées correctement (location, photo)
- [x] Deep linking configuré (`ayna://`)
- [x] Hermes activé
- [x] New Architecture activée
- [x] Bundle identifier: `com.ayna.app`
- [x] Privacy Policy URL: https://www.nurayna.com/privacy-policy.html
- [x] Terms & Conditions URL: https://www.nurayna.com/terms.html

### Privacy Nutrition Labels ⚠️
**À compléter dans App Store Connect:**

1. **Collecte de données:** OUI
   - **Type:** Identifiants, Données d'utilisation, Diagnostics
   - **Liées à l'utilisateur:** OUI
   - **Utilisées pour tracking:** NON
   - **Lien vers Privacy Policy:** ✅ Déjà renseigné

2. **Données collectées:**
   - [x] Identifiants (User ID anonymisé)
   - [x] Données d'utilisation (fonctionnalités, navigation)
   - [x] Diagnostics (erreurs techniques, pas de PII)
   - [ ] Autres (informations techniques générales)

3. **Base légale:** Consentement explicite (opt-in)

### App Tracking Transparency ✅
- [x] **Non requise** (pas de tracking cross-app/cross-site)
- [x] Pas d'IDFA collecté
- [x] Pas de tracking publicitaire

### Fonctionnalités ✅
- [x] App fonctionne à 100% sans consentement analytics
- [x] Consentement clair et équilibré (deux boutons égaux)
- [x] Pas de dark pattern
- [x] Privacy Policy accessible depuis l'app

### Review Guidelines ✅
- [x] Pas de collecte avant consentement
- [x] Consentement explicite requis
- [x] Opt-out fonctionnel
- [x] Pas de données sensibles collectées

**Status Apple:** ✅ **Prêt** (formulaires à compléter)

---

## 🤖 GOOGLE PLAY

### Conformité Technique ✅
- [x] Permissions déclarées (location, storage)
- [x] Package name: `com.ayna.app`
- [x] Hermes activé
- [x] Edge-to-edge activé
- [x] Privacy Policy URL: https://www.nurayna.com/privacy-policy.html

### Data Safety Form ⚠️
**À compléter dans Play Console:**

1. **Collecte de données:** OUI
   - **Type:**
     - [x] Identifiers (User ID anonymisé)
     - [x] App activity (fonctionnalités utilisées, navigation)
     - [ ] Device or other IDs: NON
     - [ ] Financial info: NON
     - [ ] Health & fitness: NON
     - [ ] Location: NON (seulement locale/timezone)
     - [ ] Personal info: NON
     - [ ] Photos & videos: NON
     - [ ] Messages: NON

2. **Données partagées:** NON
   - Aucune donnée n'est partagée avec des tiers

3. **Données utilisées pour tracking:** NON
   - Pas de tracking cross-app

4. **Base légale:** Consentement explicite

5. **Durée de conservation:**
   - Local: 7 jours
   - Serveur: 12 mois maximum

### Fonctionnalités ✅
- [x] App fonctionne à 100% sans consentement analytics
- [x] Opt-out fonctionnel dans Settings
- [x] Pas de collecte dissimulée
- [x] Privacy Policy accessible depuis l'app

### Content Rating ✅
- [x] **Public cible:** Tout public
- [x] **Contenu:** Spirituel, non mature
- [x] **Pas de contenu violent/sexuel**

**Status Google:** ✅ **Prêt** (formulaires à compléter)

---

## 🔒 GDPR & PRIVACY

### Consentement ✅
- [x] Hard opt-in (consent = false par défaut)
- [x] Écran de consentement au premier lancement
- [x] Deux boutons égaux (aucun dark pattern)
- [x] App fonctionne à 100% sans consentement
- [x] Opt-out dans Settings
- [x] Consentement stocké persistamment

### Données Collectées ✅
- [x] Fonctionnalités utilisées (anonymisé)
- [x] Navigation (écrans visités)
- [x] Informations techniques générales
- [x] Métriques d'utilisation (agrégées)

### Données NON Collectées ✅
- [x] Contenu journal
- [x] Messages/Conversations
- [x] Intentions spirituelles
- [x] Localisation précise (GPS)
- [x] Données personnelles identifiables (PII)
- [x] Contenu religieux personnel

### Droits Utilisateur ✅
- [x] Droit d'accès
- [x] Droit de suppression
- [x] Droit de retrait du consentement
- [x] Droit d'export (JSON)

### Sécurité ✅
- [x] Chiffrement HTTPS
- [x] Row Level Security (RLS)
- [x] Pas de PII dans événements
- [x] Anonymisation automatique
- [x] Durée de conservation limitée (7 jours local, 12 mois serveur)

---

## 📱 BUILD & DÉPLOIEMENT

### Build Configuration ✅
- [x] `eas.json` configuré (development, preview, production)
- [x] Android: AAB pour production
- [x] iOS: IPA pour production
- [x] Variables d'environnement: EAS Secrets

### Permissions ✅
**Android:**
- [x] ACCESS_FINE_LOCATION (Qibla)
- [x] ACCESS_COARSE_LOCATION (Qibla)
- [x] READ_EXTERNAL_STORAGE (avatar)
- [x] WRITE_EXTERNAL_STORAGE (avatar)

**iOS:**
- [x] NSLocationWhenInUseUsageDescription (Qibla)
- [x] NSPhotoLibraryUsageDescription (avatar)
- [x] NSPhotoLibraryAddUsageDescription (avatar)

---

## ⚠️ ACTIONS REQUISES

### Avant Soumission Stores

1. **Compléter formulaires:**
   - [ ] Apple App Store Connect → Privacy Nutrition Labels
   - [ ] Google Play Console → Data Safety Form

2. **Tester builds standalone:**
   - [ ] Build Android AAB et tester
   - [ ] Build iOS IPA et tester
   - [ ] Vérifier Qibla (sensors + location)
   - [ ] Vérifier offline sync
   - [ ] Vérifier deep linking

3. **Vérifier URLs:**
   - [x] Privacy Policy: https://www.nurayna.com/privacy-policy.html
   - [x] Terms: https://www.nurayna.com/terms.html
   - [x] Email: pro.ibrahima00@gmail.com

---

## ✅ CONFIRMATION FINALE

### Code ✅
- ✅ Hard consent gate implémenté
- ✅ Privacy Policy complète (FR + EN)
- ✅ Terms & Conditions complètes (FR + EN)
- ✅ trackError() sécurisé
- ✅ identify()/logout() sécurisés
- ✅ PII validation stricte

### Stores ✅
- ✅ Permissions déclarées
- ✅ Privacy Policy accessible
- ✅ Terms accessible
- ✅ Email de contact renseigné
- ⚠️ Formulaires à compléter

### Builds ⚠️
- ⚠️ Standalone Android: À tester
- ⚠️ Standalone iOS: À tester

---

**Status Final:** ✅ **Conforme** (formulaires stores à compléter)  
**Prêt pour review:** ✅ **Oui** (après tests standalone)





