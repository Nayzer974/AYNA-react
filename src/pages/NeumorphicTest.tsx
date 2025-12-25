import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable, 
  Animated,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Play, 
  Pause, 
  Volume2, 
  Settings, 
  Heart, 
  Star,
  TrendingUp,
  Zap,
  Moon,
  Sun
} from 'lucide-react-native';
import { NeumorphicView, NEU_COLORS } from '@/components/ui/NeumorphicView';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Page de test Neumorphic
 * 
 * Démonstration du design neumorphique avec :
 * - Cartes interactives
 * - Boutons animés
 * - Icônes animées
 * - Petites fonctionnalités
 */
export function NeumorphicTest() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [liked, setLiked] = useState(false);
  const [rating, setRating] = useState(3);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Animation pour le bouton play/pause
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const starRotation = useRef(new Animated.Value(0)).current;

  // Animation de pulse pour les icônes
  useEffect(() => {
    if (isPlaying) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      scaleAnim.setValue(1);
    }
  }, [isPlaying]);

  // Animation pour le like
  const handleLike = () => {
    setLiked(!liked);
    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.3,
        useNativeDriver: true,
        tension: 300,
        friction: 3,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 3,
      }),
    ]).start();
  };

  // Animation de rotation pour les étoiles
  useEffect(() => {
    const rotate = Animated.loop(
      Animated.timing(starRotation, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    rotate.start();
  }, []);

  const starRotate = starRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (direction: 'up' | 'down') => {
    setVolume(prev => {
      const newVolume = direction === 'up' 
        ? Math.min(100, prev + 10)
        : Math.max(0, prev - 10);
      return newVolume;
    });
  };

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[NEU_COLORS.background, NEU_COLORS.background]}
        style={StyleSheet.absoluteFill}
      />
      
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <NeumorphicView style={styles.headerCard} borderRadius={20} padding={20}>
            <Text style={styles.title}>Neumorphic Design</Text>
            <Text style={styles.subtitle}>Test & Démonstration</Text>
          </NeumorphicView>

          {/* Bouton Play/Pause animé */}
          <NeumorphicView style={styles.card} borderRadius={20} padding={24}>
            <Text style={styles.cardTitle}>Contrôle Audio</Text>
            <View style={styles.playButtonContainer}>
              <Pressable onPress={handlePlayPause}>
                {({ pressed }) => (
                  <NeumorphicView 
                    inset={pressed} 
                    borderRadius={60} 
                    padding={24}
                    style={styles.playButtonWrapper}
                  >
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                      {isPlaying ? (
                        <Pause size={40} color="#5A7BA8" />
                      ) : (
                        <Play size={40} color="#5A7BA8" fill="#5A7BA8" />
                      )}
                    </Animated.View>
                  </NeumorphicView>
                )}
              </Pressable>
              <Text style={styles.playStatus}>
                {isPlaying ? 'Lecture en cours...' : 'En pause'}
              </Text>
            </View>
          </NeumorphicView>

          {/* Contrôle de volume */}
          <NeumorphicView style={styles.card} borderRadius={20} padding={24}>
            <Text style={styles.cardTitle}>Volume</Text>
            <View style={styles.volumeContainer}>
              <Pressable 
                onPress={() => handleVolumeChange('down')}
                disabled={volume === 0}
              >
                {({ pressed }) => (
                  <NeumorphicView 
                    inset={pressed} 
                    borderRadius={12} 
                    padding={12}
                    style={styles.volumeButton}
                  >
                    <Volume2 size={20} color="#5A7BA8" />
                  </NeumorphicView>
                )}
              </Pressable>
              
              <View style={styles.volumeBarContainer}>
                <View style={styles.volumeBarTrack}>
                  <View 
                    style={[
                      styles.volumeBarFill, 
                      { width: `${volume}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.volumeText}>{volume}%</Text>
              </View>
              
              <Pressable 
                onPress={() => handleVolumeChange('up')}
                disabled={volume === 100}
              >
                {({ pressed }) => (
                  <NeumorphicView 
                    inset={pressed} 
                    borderRadius={12} 
                    padding={12}
                    style={styles.volumeButton}
                  >
                    <Volume2 size={20} color="#5A7BA8" />
                  </NeumorphicView>
                )}
              </Pressable>
            </View>
          </NeumorphicView>

          {/* Bouton Like avec animation */}
          <NeumorphicView style={styles.card} borderRadius={20} padding={24}>
            <Text style={styles.cardTitle}>Interaction</Text>
            <View style={styles.interactionContainer}>
              <Pressable onPress={handleLike}>
                {({ pressed }) => (
                  <NeumorphicView 
                    inset={pressed} 
                    borderRadius={16} 
                    padding={16}
                  >
                    <Animated.View style={{ transform: [{ scale: heartScale }] }}>
                      <Heart 
                        size={32} 
                        color={liked ? '#FF6B6B' : '#5A7BA8'}
                        fill={liked ? '#FF6B6B' : 'none'}
                      />
                    </Animated.View>
                  </NeumorphicView>
                )}
              </Pressable>
              
              <Text style={styles.interactionText}>
                {liked ? 'Vous aimez ça!' : 'Appuyez pour aimer'}
              </Text>
            </View>
          </NeumorphicView>

          {/* Système de notation */}
          <NeumorphicView style={styles.card} borderRadius={20} padding={24}>
            <Text style={styles.cardTitle}>Note</Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setRating(star)}
                >
                  {({ pressed }) => (
                    <NeumorphicView 
                      inset={pressed} 
                      borderRadius={12} 
                      padding={8}
                      style={styles.starButton}
                    >
                      <Animated.View 
                        style={star === 3 ? { transform: [{ rotate: starRotate }] } : {}}
                      >
                        <Star 
                          size={28} 
                          color="#FFD700"
                          fill={star <= rating ? '#FFD700' : 'none'}
                        />
                      </Animated.View>
                    </NeumorphicView>
                  )}
                </Pressable>
              ))}
              <Text style={styles.ratingText}>{rating}/5</Text>
            </View>
          </NeumorphicView>

          {/* Statistiques */}
          <NeumorphicView style={styles.card} borderRadius={20} padding={24}>
            <Text style={styles.cardTitle}>Statistiques</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <NeumorphicView inset borderRadius={12} padding={12}>
                  <TrendingUp size={24} color="#5A7BA8" />
                </NeumorphicView>
                <Text style={styles.statValue}>1,234</Text>
                <Text style={styles.statLabel}>Vues</Text>
              </View>
              
              <View style={styles.statItem}>
                <NeumorphicView inset borderRadius={12} padding={12}>
                  <Zap size={24} color="#5A7BA8" />
                </NeumorphicView>
                <Text style={styles.statValue}>567</Text>
                <Text style={styles.statLabel}>Actions</Text>
              </View>
              
              <View style={styles.statItem}>
                <NeumorphicView inset borderRadius={12} padding={12}>
                  <Heart size={24} color="#5A7BA8" />
                </NeumorphicView>
                <Text style={styles.statValue}>89</Text>
                <Text style={styles.statLabel}>J'aime</Text>
              </View>
            </View>
          </NeumorphicView>

          {/* Toggle Theme */}
          <NeumorphicView style={styles.card} borderRadius={20} padding={24}>
            <Text style={styles.cardTitle}>Thème</Text>
            <Pressable
              onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {({ pressed }) => (
                <NeumorphicView 
                  inset={pressed} 
                  borderRadius={16} 
                  padding={16}
                  style={styles.themeToggle}
                >
                  <View style={styles.themeContent}>
                    {theme === 'light' ? (
                      <Sun size={32} color="#FFA500" fill="#FFA500" />
                    ) : (
                      <Moon size={32} color="#5A7BA8" fill="#5A7BA8" />
                    )}
                    <Text style={styles.themeText}>
                      Mode {theme === 'light' ? 'Clair' : 'Sombre'}
                    </Text>
                  </View>
                </NeumorphicView>
              )}
            </Pressable>
          </NeumorphicView>

          {/* Boutons d'action */}
          <View style={styles.actionsRow}>
            <Pressable>
              {({ pressed }) => (
                <NeumorphicView 
                  inset={pressed} 
                  borderRadius={16} 
                  padding={16}
                  style={styles.actionButton}
                >
                  <Settings size={24} color="#5A7BA8" />
                  <Text style={styles.actionButtonText}>Paramètres</Text>
                </NeumorphicView>
              )}
            </Pressable>
            
            <Pressable>
              {({ pressed }) => (
                <NeumorphicView 
                  inset={pressed} 
                  borderRadius={16} 
                  padding={16}
                  style={styles.actionButton}
                >
                  <Star size={24} color="#5A7BA8" />
                  <Text style={styles.actionButtonText}>Favoris</Text>
                </NeumorphicView>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: NEU_COLORS.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerCard: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4A5568',
    marginBottom: 8,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    fontFamily: 'System',
  },
  card: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginBottom: 16,
    fontFamily: 'System',
  },
  playButtonContainer: {
    alignItems: 'center',
  },
  playButtonWrapper: {
    marginBottom: 16,
  },
  playStatus: {
    fontSize: 14,
    color: '#718096',
    fontFamily: 'System',
  },
  volumeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  volumeButton: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volumeBarContainer: {
    flex: 1,
    alignItems: 'center',
  },
  volumeBarTrack: {
    width: '100%',
    height: 8,
    backgroundColor: NEU_COLORS.darkShadow,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: '100%',
    backgroundColor: '#5A7BA8',
    borderRadius: 4,
  },
  volumeText: {
    fontSize: 12,
    color: '#718096',
    fontFamily: 'System',
  },
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  interactionText: {
    fontSize: 16,
    color: '#4A5568',
    fontFamily: 'System',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starButton: {
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A5568',
    marginLeft: 'auto',
    fontFamily: 'System',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4A5568',
    marginTop: 8,
    fontFamily: 'System',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
    fontFamily: 'System',
  },
  themeToggle: {
    width: '100%',
  },
  themeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  themeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4A5568',
    fontFamily: 'System',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A5568',
    fontFamily: 'System',
  },
});

