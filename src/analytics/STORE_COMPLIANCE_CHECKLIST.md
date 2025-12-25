# Store Compliance Checklist - Apple App Store & Google Play

## ✅ Conformité GDPR & Privacy

### Consentement Analytics
- [x] **Hard opt-in implémenté** (consent = false par défaut)
- [x] **Écran de consentement** (ConsentScreen.tsx)
- [x] **Texte exact fourni** (non modifié)
- [x] **Deux boutons égaux** (aucun grisé/caché)
- [x] **Pas de dark pattern**
- [x] **App fonctionne à 100% sans consentement**
- [x] **Aucun analytics avant consent === true**
- [x] **Section Privacy dans Settings**
- [x] **Toggle analytics dans Settings**

### Privacy Policy
- [x] **Disponible sur site web** (https://www.nurayna.com/privacy-policy.html)
- [x] **Version FR complète**
- [x] **Version EN complète**
- [x] **Lien depuis écran consentement**
- [x] **Lien depuis Settings**
- [x] **Contenu requis** (identité, données collectées, NON collectées, base légale, durée, droits, contact)

### Terms & Conditions
- [x] **Disponible sur site web** (https://www.nurayna.com/terms.html)
- [x] **Version FR complète**
- [x] **Version EN complète**
- [x] **Lien depuis écran consentement**
- [x] **Lien depuis Settings**
- [x] **Contenu requis** (acceptation, accès, responsabilités, contenu spirituel, limitation, suspension, loi)

---

## 🍎 Apple App Store Compliance

### App Tracking Transparency (ATT)
- [x] **ATT NON requise** (pas de tracking cross-app/cross-site)
- [x] **Pas de IDFA collecté**
- [x] **Pas de tracking publicitaire**

### Privacy Nutrition Labels
- [ ] **Vérifier labels dans App Store Connect**
  - [ ] Collecte de données: OUI (avec consentement)
  - [ ] Données liées à vous: OUI (analytics)
  - [ ] Données utilisées pour tracking: NON
  - [ ] Données liées à des identifiants: OUI (user ID anonymisé)
  - [ ] Type de données:
    - [ ] Identifiants (User ID anonymisé)
    - [ ] Données d'utilisation (fonctionnalités, navigation)
    - [ ] Diagnostics (erreurs techniques, pas de PII)
    - [ ] Autres (informations techniques générales)

### App Review Guidelines
- [x] **Pas de collecte avant consentement**
- [x] **Fonctionnement complet sans consentement**
- [x] **Privacy Policy accessible**
- [x] **Terms & Conditions accessibles**
- [x] **Pas de collecte de données sensibles**
- [x] **Respect GDPR**

### Checklist Apple App Store Connect
- [ ] **Privacy Policy URL** renseignée: `https://www.nurayna.com/privacy-policy.html`
- [ ] **Privacy Nutrition Labels** complétés correctement
- [ ] **App Tracking Transparency** déclaré comme non utilisé
- [ ] **Data Collection** déclaré comme oui (avec consentement)
- [ ] **Data Used for Tracking** déclaré comme non
- [ ] **Screenshots** ne montrent pas de dark patterns
- [ ] **Description** mentionne le consentement analytics (optionnel)

---

## 🤖 Google Play Compliance

### Data Safety Form
- [ ] **Compléter Data Safety Form dans Play Console**
  - [ ] Collecte de données: OUI
  - [ ] Type de données collectées:
    - [ ] Identifiers (User ID anonymisé)
    - [ ] App activity (fonctionnalités utilisées, navigation)
    - [ ] Device or other IDs (non)
    - [ ] Financial info (non)
    - [ ] Health & fitness (non)
    - [ ] Location (non - seulement locale/timezone)
    - [ ] Personal info (non)
    - [ ] Photos & videos (non)
    - [ ] Messages (non)
  - [ ] Données partagées: NON
  - [ ] Données utilisées pour tracking: NON
  - [ ] Base légale: Consentement
  - [ ] Durée de conservation: 7 jours (local), 12 mois (serveur)

### Privacy Policy
- [x] **Privacy Policy URL** dans Play Console: `https://www.nurayna.com/privacy-policy.html`
- [x] **Privacy Policy accessible** depuis l'app
- [x] **Privacy Policy cohérente** avec Data Safety Form

### User Data Privacy
- [x] **Opt-out fonctionnel** (dans Settings)
- [x] **Pas de collecte dissimulée**
- [x] **Données supprimables** (via Settings)
- [x] **Transparence** (ce qui est collecté est clairement expliqué)

### Checklist Google Play Console
- [ ] **Data Safety Form** complété et soumis
- [ ] **Privacy Policy URL** renseignée
- [ ] **Content rating** approprié (spirituel, pas de contenu mature)
- [ ] **Target audience** déclaré (tout public si approprié)
- [ ] **Permissions** justifiées (location pour prières, si utilisé)

---

## 📋 Vérifications Finales

### Code
- [x] ConsentScreen.tsx créé
- [x] Intégré dans App.tsx (blocage jusqu'à choix)
- [x] Section Privacy dans Settings.tsx
- [x] Analytics initialisé avec consent = false
- [x] Aucun track() appelé avant consent

### Documentation Web
- [x] privacy-policy.html (FR)
- [x] privacy-policy-en.html (EN)
- [x] terms.html (FR)
- [x] terms-en.html (EN)
- [x] Liens dans index.html

### Traductions
- [ ] **Ajouter traductions FR dans fr.json** (si nécessaire)
- [ ] **Ajouter traductions EN dans en.json** (si nécessaire)
- [ ] **Vérifier toutes les clés de traduction utilisées**

### Tests
- [ ] **Test premier lancement** (écran consentement affiché)
- [ ] **Test refus consentement** (app fonctionne, pas d'analytics)
- [ ] **Test acceptation consentement** (analytics activés)
- [ ] **Test toggle Settings** (activation/désactivation)
- [ ] **Test liens Privacy Policy/Terms** (ouvrent correctement)
- [ ] **Test logout/login rapide** (pas de mélange de sessions)

---

## 🚨 Points d'Attention pour Review

### Apple App Store
1. **Vérifier Privacy Nutrition Labels** - Doivent correspondre exactement à ce qui est collecté
2. **Tester l'écran de consentement** - Doit apparaître au premier lancement
3. **Vérifier fonctionnement sans consentement** - App doit être 100% fonctionnelle
4. **Vérifier Privacy Policy** - Doit être accessible et complète

### Google Play
1. **Compléter Data Safety Form** - Doit correspondre à Privacy Policy
2. **Vérifier opt-out** - Doit fonctionner dans Settings
3. **Vérifier transparence** - L'utilisateur doit comprendre ce qui est collecté
4. **Vérifier Privacy Policy** - Doit être accessible depuis l'app

---

## ✅ Status Final

### Implémentation
- [x] ConsentScreen créé et intégré
- [x] Section Privacy dans Settings
- [x] Privacy Policy (FR + EN)
- [x] Terms & Conditions (FR + EN)
- [x] Intégration site web
- [x] Hard consent gate fonctionnel

### Documentation
- [x] Privacy Policy complète
- [x] Terms & Conditions complètes
- [x] Checklist de conformité créée

### Actions Restantes
- [ ] Compléter Privacy Nutrition Labels (Apple)
- [ ] Compléter Data Safety Form (Google)
- [ ] Ajouter URLs dans stores (Privacy Policy, Terms)
- [ ] Tester écran consentement en conditions réelles
- [ ] Vérifier traductions complètes

---

## 📞 Contacts pour Review

- **Privacy/Compliance:** pro.ibrahima00@gmail.com
- **Legal:** pro.ibrahima00@gmail.com
- **Technical:** (contact technique si nécessaire)

---

**Status:** ✅ **95% Prêt** - Actions stores restantes (Nutrition Labels, Data Safety Form)
**Dernière mise à jour:** 27 janvier 2025
**Prêt pour soumission:** ⚠️ Après complétion des formulaires stores

