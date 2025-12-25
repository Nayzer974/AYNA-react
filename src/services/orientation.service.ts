/**
 * Service de calcul de l'orientation du téléphone (Android)
 * Implémentation simple et fiable : accelerometer + magnetometer
 */

type AccelerometerData = { x: number; y: number; z: number };
type MagnetometerData = { x: number; y: number; z: number };

export interface OrientationData {
  pitch: number; // -90 à 90
  roll: number; // -180 à 180
  yaw: number; // 0-360, heading magnétique
}

/**
 * Calcule l'orientation complète (pitch, roll, yaw) à partir des capteurs
 * Android : X = Est, Y = Nord, Z = Haut
 */
export function calculateOrientation(
  accelerometer: AccelerometerData,
  magnetometer: MagnetometerData
): OrientationData {
  // Validation
  if (
    !accelerometer || !magnetometer ||
    !Number.isFinite(accelerometer.x) || !Number.isFinite(accelerometer.y) || !Number.isFinite(accelerometer.z) ||
    !Number.isFinite(magnetometer.x) || !Number.isFinite(magnetometer.y) || !Number.isFinite(magnetometer.z)
  ) {
    return { pitch: 0, roll: 0, yaw: 0 };
  }

  const { x: ax, y: ay, z: az } = accelerometer;
  const { x: mx, y: my, z: mz } = magnetometer;

  // Calculer pitch et roll depuis l'accéléromètre
  // Android : X = Est, Y = Nord, Z = Haut
  const pitch = Math.asin(-ax) * (180 / Math.PI);
  const roll = Math.atan2(ay, az) * (180 / Math.PI);

  // Calculer le yaw (heading) en compensant l'inclinaison
  const cosPitch = Math.cos(pitch * Math.PI / 180);
  const sinPitch = Math.sin(pitch * Math.PI / 180);
  const cosRoll = Math.cos(roll * Math.PI / 180);
  const sinRoll = Math.sin(roll * Math.PI / 180);

  // Rotation des données magnétiques pour compenser pitch/roll
  // Formule standard Android
  const bx = mx * cosRoll + my * sinRoll * sinPitch - mz * sinRoll * cosPitch;
  const by = -mx * sinRoll + my * cosRoll;

  // Calculer le yaw (heading) - FORMULE CORRIGÉE
  // Android : X = Est, Y = Nord, Z = Haut
  // Le problème : la boussole pointe vers l'opposé, donc il faut inverser le heading
  // Solution : ajouter 180° au heading calculé pour inverser la direction
  let yaw = Math.atan2(by, bx) * (180 / Math.PI);
  
  // CORRECTION : Ajouter 180° pour inverser la direction (car la boussole pointe vers l'opposé)
  yaw = yaw + 180;
  
  // Normaliser entre 0 et 360
  yaw = (yaw + 360) % 360;

  return { pitch, roll, yaw };
}
