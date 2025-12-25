// components/Tasbih.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import Bead from './Bead';
import { useTasbihSound } from '@/hooks/useTasbihSound';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TOTAL_BEADS_DISPLAY = 33; // Nombre de perles pour un cycle
const BEAD_SIZE = 60; // Taille d'une perle en pixels
const BEAD_MARGIN = 10; // Marge entre les perles
const BEAD_TOTAL_WIDTH = BEAD_SIZE + BEAD_MARGIN; // Largeur totale occupée par une perle
const OFFSET_TO_CENTER = (SCREEN_WIDTH / 2) - (BEAD_SIZE / 2); // Pour centrer la perle active

// Calcul du nombre de perles nécessaires pour couvrir l'écran + buffer pour l'infini
// On calcule combien de perles sont nécessaires pour couvrir la largeur de l'écran
const BEADS_TO_COVER_SCREEN = Math.ceil(SCREEN_WIDTH / BEAD_TOTAL_WIDTH);
// On ajoute un buffer à droite pour que l'utilisateur ne voie jamais la fin
const BUFFER_BEADS = 10; // Perles supplémentaires à droite
const MIN_VISIBLE_BEADS = BEADS_TO_COVER_SCREEN + BUFFER_BEADS; // Minimum de perles à toujours avoir

interface TasbihProps {
  dhikrText?: string;
  target?: number;
}

const Tasbih: React.FC<TasbihProps> = ({ 
  dhikrText = "SubhanAllah",
  target = 33 
}) => {
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [count, setCount] = useState(0); // Compteur de dhikr
  const translateX = useSharedValue(OFFSET_TO_CENTER); // Position X de la chaîne de perles
  const { playClick, playChime } = useTasbihSound();

  // Mettre à jour l'animation quand count change
  useEffect(() => {
    // Version simple : calculer la position pour que la perle active soit centrée
    // On synchronise avec displayedBeads qui commence à startIndex
    const beadsVisibleOnLeft = Math.ceil((SCREEN_WIDTH / 2) / BEAD_TOTAL_WIDTH);
    const startIndex = Math.max(0, count - beadsVisibleOnLeft);
    const relativePosition = count - startIndex;
    const targetPosition = OFFSET_TO_CENTER - (relativePosition * BEAD_TOTAL_WIDTH);
    
    translateX.value = withSpring(
      targetPosition,
      {
        mass: 1,
        damping: 15,
        stiffness: 120,
      }
    );
  }, [count, translateX]);

  const handlePress = useCallback(() => {
    playClick(); // Joue le son du clic et la vibration légère

    setCount((prev) => {
      const newCount = prev + 1;

      // Vérifie si un cycle est terminé
      if (newCount > 0 && newCount % target === 0) {
        playChime(); // Joue le son de fin de cycle et la vibration de succès
      }

      return newCount;
    });
  }, [playClick, playChime, target]);

  const handleReset = useCallback(() => {
    setCount(0);
    // Ramène la chaîne à la position initiale
    translateX.value = withSpring(OFFSET_TO_CENTER, {
      mass: 1,
      damping: 15,
      stiffness: 120,
    });
    playChime(); // Un petit son pour le reset
  }, [playChime, translateX]);

  // Style animé pour la chaîne de perles
  const animatedBeadStringStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Calcule les perles visibles avec génération infinie
  // Chaque clic ajoute une nouvelle perle à la fin (à droite)
  // Les perles qui sortent de l'écran à gauche sont supprimées pour optimiser
  const displayedBeads = useMemo(() => {
    const beads = [];
    
    // Calculer l'index de départ : on garde seulement les perles qui sont encore visibles
    // On calcule combien de perles peuvent être visibles à gauche de la perle active
    const beadsVisibleOnLeft = Math.ceil((SCREEN_WIDTH / 2) / BEAD_TOTAL_WIDTH);
    
    // Index de départ : on commence quelques perles avant la perle active
    // mais on ne garde que les perles qui sont encore dans la zone visible
    const startIndex = Math.max(0, count - beadsVisibleOnLeft);
    
    // Index de fin : on va jusqu'à count (perle active) + buffer à droite
    // On s'assure d'avoir toujours assez de perles pour couvrir l'écran
    const minBeads = Math.max(MIN_VISIBLE_BEADS, beadsVisibleOnLeft + BUFFER_BEADS + 1);
    const endIndex = Math.max(count + BUFFER_BEADS, startIndex + minBeads - 1);
    
    // Générer les perles visibles de startIndex à endIndex
    for (let i = startIndex; i <= endIndex; i++) {
      beads.push({
        index: i,
        visualIndex: i - startIndex,
        isCompleted: i < count,
        isActive: i === count,
      });
    }
    
    return beads;
  }, [count]);

  const currentCycle = Math.floor(count / target) + 1;
  const currentCycleCount = count % target;

  return (
    <View style={styles.container}>
      {/* Compteur de Dhikr */}
      <View style={styles.counterDisplay}>
        <Text style={[styles.countText, { color: theme.colors.text }]}>{String(count)}</Text>
        <Text style={[styles.subText, { color: theme.colors.textSecondary }]}>{dhikrText}</Text>
        <Text style={[styles.cycleText, { color: theme.colors.textSecondary }]}>
          Cycle: {String(currentCycle)} • {String(currentCycleCount)}/{String(target)}
        </Text>
      </View>

      {/* Zone interactive des perles */}
      <Pressable onPress={handlePress} style={styles.interactiveArea}>
        {/* Marqueur central (fixe) */}
        <View style={[styles.marker, { backgroundColor: theme.colors.accent || '#FFD700' }]} />

        {/* Chaîne de perles animée */}
        <Animated.View style={[styles.beadString, animatedBeadStringStyle]}>
          {displayedBeads.map((bead) => {
            return (
              <View key={`bead-${bead.index}`} style={styles.beadWrapper}>
                <Bead
                  size={BEAD_SIZE}
                  color={bead.isCompleted ? (theme.colors.accent || "#2ecc71") : (theme.colors.secondary || "#3498db")}
                  isActive={bead.isActive}
                />
              </View>
            );
          })}
        </Animated.View>
      </Pressable>

      {/* Bouton Réinitialiser */}
      <Pressable onPress={handleReset} style={[styles.resetButton, { backgroundColor: theme.colors.accent || '#E74C3C' }]}>
        <Text style={styles.resetButtonText}>Réinitialiser</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  counterDisplay: {
    marginBottom: 40,
    alignItems: 'center',
  },
  countText: {
    fontSize: 80,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
  subText: {
    fontSize: 20,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: -10,
    fontFamily: 'System',
  },
  cycleText: {
    fontSize: 16,
    marginTop: 10,
    fontFamily: 'System',
  },
  interactiveArea: {
    width: '100%',
    height: BEAD_SIZE + BEAD_MARGIN * 2, // Hauteur suffisante pour les perles + marges
    overflow: 'hidden', // Cache les perles qui débordent
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  marker: {
    position: 'absolute',
    left: '50%',
    width: 3,
    height: '100%',
    transform: [{ translateX: -1.5 }], // Centrer le marqueur
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  beadString: {
    flexDirection: 'row',
  },
  beadWrapper: {
    width: BEAD_TOTAL_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButton: {
    marginTop: 50,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 5, // Ombre Android
    shadowColor: '#000', // Ombre iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
});

export default Tasbih;

