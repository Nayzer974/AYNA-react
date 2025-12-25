# 🔍 Diagnostic Boussole Qibla - Informations Complètes

## 1️⃣ Plateforme

**Android Expo** (tout)

---

## 2️⃣ Code Réel - Calcul du Heading

### Fichier : `application/src/services/orientation.service.ts`

**Fonction principale : `calculateOrientation()`** (lignes 42-93)

```typescript
export function calculateOrientation(
  accelerometer: AccelerometerData,
  magnetometer: MagnetometerData
): OrientationData {
  const { x: ax, y: ay, z: az } = accelerometer;
  const { x: mx, y: my, z: mz } = magnetometer;

  // Pitch et roll depuis accéléromètre
  const pitch = Math.asin(-ax) * (180 / Math.PI);
  const roll = Math.atan2(ay, az) * (180 / Math.PI);

  // Compensation pitch/roll pour le magnétomètre
  const cosPitch = Math.cos(pitch * Math.PI / 180);
  const sinPitch = Math.sin(pitch * Math.PI / 180);
  const cosRoll = Math.cos(roll * Math.PI / 180);
  const sinRoll = Math.sin(roll * Math.PI / 180);

  // Rotation des données magnétiques
  const bx = mx * cosRoll + my * sinRoll * sinPitch + mz * sinRoll * cosPitch;
  const by = my * cosRoll - mz * sinRoll;

  // Calcul du yaw (heading) - LIGNE CRITIQUE
  let yaw = Math.atan2(bx, by) * (180 / Math.PI);
  yaw = (yaw + 360) % 360;

  return {
    magneticHeading: calculateMagneticHeading(magnetometer), // Version simple
    pitch,
    roll,
    yaw, // ← C'est cette valeur qui est utilisée comme heading
  };
}
```

**Fonction simple : `calculateMagneticHeading()`** (lignes 20-36)

```typescript
export function calculateMagneticHeading(magnetometer: MagnetometerData): number {
  const { x, y } = magnetometer;
  
  // LIGNE CRITIQUE - Calcul du heading
  let heading = Math.atan2(x, y) * (180 / Math.PI);
  heading = (heading + 360) % 360;
  
  return heading;
}
```

### Fichier : `application/src/hooks/useHeading.ts`

**Valeur finale utilisée : `trueHeading`** (lignes 74-82)

```typescript
// Utiliser le yaw (heading compensé) plutôt que le heading simple
const headingRaw = orientation.yaw; // ← Utilise le yaw de calculateOrientation

// Filtrer le heading (lissage)
const filteredMagneticHeading = headingFilterRef.current.filter(headingRaw);

// Convertir en heading vrai (ajout de la déclinaison)
const trueHeadingValue = magneticToTrueHeading(filteredMagneticHeading, declination);
// declination = 0 actuellement (pas d'API intégrée)

setTrueHeading(trueHeadingValue);
```

**Valeur finale : `trueHeading = magneticHeading + declination`**
- `magneticHeading` = `yaw` filtré (de `calculateOrientation`)
- `declination` = 0 (pas encore implémenté)

---

## 3️⃣ Code Exact - Calcul de Rotation Affichée

### Fichier : `application/src/hooks/useQibla.ts` (lignes 74-91)

**LIGNE CRITIQUE :**

```typescript
const rotation = useMemo(() => {
  if (bearingKaaba === null || trueHeading === null) {
    return null;
  }

  // LIGNE 82 : Calcul de la rotation
  let rot = bearingKaaba - trueHeading;
  
  // Normaliser entre -180 et 180
  rot = ((rot + 180) % 360) - 180;
  
  // LIGNE 90 : Inversion du signe pour CSS
  return -rot; // ← VALEUR FINALE RETOURNÉE
}, [bearingKaaba, trueHeading]);
```

**Formule complète :**
```
rotation = -(bearingKaaba - trueHeading)
rotation = -(bearingKaaba - trueHeading) normalisé entre -180 et 180
```

### Fichier : `application/src/components/QiblaCompass.tsx` (lignes 30-47)

**Application de la rotation :**

```typescript
const safeRotation = ensureValidRotation(rotation);
const rotationValue = useSharedValue(-safeRotation); // ← Double inversion !

useEffect(() => {
  const currentRotation = ensureValidRotation(rotation);
  const targetValue = -currentRotation; // ← Encore une inversion
  
  rotationValue.value = withSpring(targetValue, {...});
}, [rotation, rotationValue]);
```

**Problème identifié : DOUBLE INVERSION !**
- `useQibla` retourne `rotation = -(bearing - heading)`
- `QiblaCompass` applique encore `-rotation`
- **Résultat :** `rotationValue = -(-(bearing - heading)) = bearing - heading`
- **Donc finalement :** la flèche tourne de `bearing - heading` (correct)

---

## 4️⃣ Dump Réel de Valeurs (À Obtenir)

### Instructions pour obtenir les valeurs

1. Ouvre l'app sur **Android Expo**
2. Va sur la page **Qibla**
3. Clique sur **⚙️** (bouton Settings) pour ouvrir le **Debug**
4. **Téléphone à plat** (oui/non) : ________
5. **Modèle téléphone** : ________
6. **Version Android** : ________

### Valeurs à copier depuis l'écran Debug

**Section GPS :**
- Latitude: `________`
- Longitude: `________`
- Accuracy: `________ m`
- Speed: `________ m/s`
- GPS Heading: `________`

**Section Orientation :**
- Magnetic Heading: `________`
- True Heading: `________`
- Source: `________` (GPS ou Capteurs)
- Pitch: `________`
- Roll: `________`
- Yaw: `________`

**Section Qibla :**
- Bearing Kaaba: `________`
- Rotation finale: `________`
- Calcul: `________`

**Section État :**
- Loading: `________`
- Error: `________`

---

## 🔴 Problème Identifié

D'après tes données précédentes :
- **Position B (visant Kaaba)** : bearing = 113.7°, trueHeading = 210.5°, rotation = 98.2°
- **Maintenant** : rotation finale = 90°

**Hypothèse :** Le calcul du `yaw` dans `calculateOrientation()` a un décalage de 90° sur Android.

**Ligne suspecte (orientation.service.ts, ligne 79) :**
```typescript
let yaw = Math.atan2(bx, by) * (180 / Math.PI);
```

Sur Android, il faudrait peut-être :
- `Math.atan2(by, bx)` au lieu de `Math.atan2(bx, by)`
- Ou ajouter/soustraire 90°

---

## ✅ Correction à Tester

Une fois que tu m'envoies le dump complet, je pourrai :
1. Vérifier si le problème vient de `atan2(bx, by)` vs `atan2(by, bx)`
2. Vérifier si c'est un problème de déclinaison magnétique (actuellement = 0)
3. Vérifier si c'est un problème d'axes Android (x/y inversés)
4. Te donner la correction exacte ligne par ligne

---

## 📝 Template de Réponse

Copie-colle ce template et remplis-le :

```
Plateforme: Android Expo
Modèle: [tout]
Version Android: [tout]
Téléphone à plat: Oui/Non

GPS:
Lat: [VALEUR]
Lng: [VALEUR]
Accuracy: [VALEUR] m
Speed: [VALEUR] m/s
GPS Heading: [VALEUR]

Orientation:
Magnetic Heading: [VALEUR]
True Heading: [VALEUR]
Source: [GPS/Capteurs]
Pitch: [VALEUR]
Roll: [VALEUR]
Yaw: [VALEUR]

Qibla:
Bearing Kaaba: [VALEUR]
Rotation finale: [VALEUR]
Calcul: [VALEUR]

État:
Loading: [Oui/Non]
Error: [VALEUR ou -]
```


