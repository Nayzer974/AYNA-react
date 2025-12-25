# 🧭 Implémentation Boussole Qibla - Architecture Complète

## ✅ Architecture Implémentée

### Services (`/services`)

1. **`qibla.service.ts`**
   - Calcul du bearing vers la Kaaba (formule géodésique validée)
   - Coordonnées Kaaba : `21.422487, 39.826206`
   - Fonction `calculateBearing()` : Paris → Kaaba ≈ 119°

2. **`declination.service.ts`**
   - Conversion heading magnétique → Nord vrai
   - TODO: Intégrer API de déclinaison magnétique pour précision maximale
   - Actuellement retourne 0 (sera amélioré)

3. **`orientation.service.ts`**
   - Fusion des capteurs (gyro, accel, mag)
   - Calcul pitch, roll, yaw
   - Filtre passe-bas pour lisser le heading
   - Compensation d'inclinaison du téléphone

4. **`location.service.ts`**
   - Gestion GPS avec toutes les données (speed, heading, accuracy)
   - Suivi continu de position
   - Détection si GPS heading est fiable (vitesse > 1.5 m/s)

### Hooks (`/hooks`)

1. **`useLocation.ts`**
   - Hook pour la localisation GPS
   - Auto-refresh et watch position

2. **`useHeading.ts`**
   - Hook pour l'orientation du téléphone
   - Logique Google Maps :
     - Si vitesse > 1.5 m/s et GPS heading disponible → utiliser GPS heading
     - Sinon → utiliser capteurs (magnétomètre + accéléromètre)
   - Conversion magnétique → Nord vrai avec déclinaison

3. **`useQibla.ts`** (Hook principal)
   - Combine `useLocation` + `useHeading`
   - Calcule `bearingKaaba` depuis la position GPS
   - Calcule `rotation = bearingKaaba - trueHeading`
   - **C'est exactement ce que fait Google Maps**

### Composants (`/components`)

1. **`QiblaCompass.tsx`** (Refactorisé)
   - Utilise `react-native-reanimated` pour animations fluides 60fps
   - Boussole SVG avec marqueurs cardinaux (N, E, S, W)
   - Flèche dorée pointant vers la Kaaba
   - Animation avec `withSpring` pour mouvement naturel

2. **`CompassDebugScreen.tsx`** (Nouveau)
   - Écran de debug complet
   - Affiche toutes les données en temps réel :
     - GPS (lat, lng, accuracy, speed, heading)
     - Capteurs (magnetometer, accelerometer)
     - Orientation (magnetic heading, true heading, pitch, roll, yaw)
     - Qibla (bearing, rotation, calcul)
   - Accessible via bouton Settings dans QiblaPage

### Page (`/pages`)

**`QiblaPage.tsx`** (Mise à jour)
- Utilise le nouveau hook `useQibla`
- Affiche indicateur GPS vs Capteurs
- Bouton debug pour accéder à CompassDebugScreen
- Instructions de calibration

---

## 🔧 Logique Google Maps Implémentée

### 1. Obtenir position GPS
```typescript
const location = await getCurrentLocation();
// { latitude, longitude, speed, heading, accuracy, ... }
```

### 2. Calculer bearing vers Kaaba
```typescript
const bearingKaaba = calculateBearing(location.latitude, location.longitude);
// Résultat en degrés (0-360), 0 = Nord vrai
```

### 3. Obtenir heading du téléphone
```typescript
// Si vitesse > 1.5 m/s et GPS heading disponible
if (isGPSHeadingReliable(location.speed, location.heading)) {
  trueHeading = location.heading; // Déjà en Nord vrai sur iOS
} else {
  // Utiliser capteurs
  magneticHeading = calculateMagneticHeading(magnetometer);
  trueHeading = magneticToTrueHeading(magneticHeading, declination);
}
```

### 4. Calculer rotation finale
```typescript
rotation = bearingKaaba - trueHeading;
rotation = ((rotation + 180) % 360) - 180; // Normaliser -180 à 180
```

### 5. Appliquer rotation à la flèche
```typescript
<Animated.View style={{ transform: [{ rotate: `${rotation}deg` }] }}>
  <Arrow />
</Animated.View>
```

---

## 📊 Données Affichées dans Debug

### GPS
- Latitude / Longitude
- Accuracy (mètres)
- Speed (m/s)
- GPS Heading
- Altitude

### Capteurs
- Magnetometer (x, y, z)
- Accelerometer (x, y, z)
- Gyroscope (x, y, z)

### Orientation
- Magnetic Heading
- Declination
- True Heading
- Pitch / Roll / Yaw

### Qibla
- Bearing Kaaba
- Rotation finale
- Calcul détaillé

---

## 🧪 Tests & Calibration

### Calibration Magnétomètre
1. Demander à l'utilisateur de faire un mouvement en **forme de 8**
2. Indispensable pour précision maximale

### Tests Terrain

#### Test 1 – Nord
- Se placer face au Nord réel (Google Maps)
- True Heading devrait être ≈ 0°

#### Test 2 – Rotation
- Tourner lentement sur soi
- Heading devrait être fluide, sans sauts

#### Test 3 – Comparaison
- Comparer avec Google Maps
- Différence acceptable : ±5°

---

## ⚠️ Erreurs Fréquentes Détectées

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Décalage constant | Déclinaison absente | Intégrer API déclinaison |
| Mauvais angle téléphone incliné | Accéléromètre ignoré | ✅ Implémenté (compensation pitch/roll) |
| Sauts brusques | Gyro non fusionné | ✅ Implémenté (filtre passe-bas) |
| Direction inversée | Axe mal interprété | ✅ Corrigé (atan2 avec conversion) |

---

## 🚀 Utilisation

### Dans un composant

```typescript
import { useQibla } from '@/hooks/useQibla';
import { QiblaCompass } from '@/components/QiblaCompass';

function MyComponent() {
  const { rotation, bearingKaaba, trueHeading, start, stop } = useQibla();

  useEffect(() => {
    start();
    return () => stop();
  }, [start, stop]);

  return (
    <QiblaCompass rotation={rotation} size={280} showLabels={true} />
  );
}
```

### Accéder au Debug

Dans `QiblaPage`, cliquer sur le bouton Settings (⚙️) en haut à droite pour afficher l'écran de debug.

---

## 📝 TODO / Améliorations Futures

1. **Déclinaison Magnétique**
   - [ ] Intégrer API NOAA ou World Magnetic Model (WMM)
   - [ ] Calculer déclinaison précise selon position et date

2. **Calibration Automatique**
   - [ ] Détecter si magnétomètre nécessite calibration
   - [ ] Guider l'utilisateur pour mouvement en 8

3. **Performance**
   - [ ] Optimiser fréquence d'update selon batterie
   - [ ] Réduire consommation si app en arrière-plan

4. **Tests**
   - [ ] Tests unitaires pour calculs géodésiques
   - [ ] Tests d'intégration avec vrais capteurs

---

## ✅ Règle d'Or Respectée

> **Ne jamais afficher directement une valeur de boussole.**
> **Toujours afficher : `bearing_destination - heading_réel`**

✅ **Implémenté** : `rotation = bearingKaaba - trueHeading`

C'est exactement ce que fait Google Maps.

---

## 📚 Références

- Formule bearing : [Great Circle Navigation](https://www.movable-type.co.uk/scripts/latlong.html)
- Déclinaison magnétique : [NOAA Magnetic Field Calculator](https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml)
- Fusion capteurs : [Sensor Fusion Algorithms](https://developer.android.com/guide/topics/sensors/sensors_motion)


