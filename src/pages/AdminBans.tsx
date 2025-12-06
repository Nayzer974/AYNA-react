import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ban, X, Clock, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { supabase, isCurrentUserAdmin } from '@/services/supabase';

interface BanRecord {
  id: string;
  user_id: string;
  user_email: string;
  ban_type: 'temporary' | 'permanent';
  duration_minutes: number | null;
  banned_at: string;
  expires_at: string | null;
  banned_by: string;
  reason: string | null;
}

export function AdminBans() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [isAdmin, setIsAdmin] = useState(false);
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [unbanning, setUnbanning] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function checkAdmin() {
      try {
        if (user?.id) {
          const adminStatus = user.isAdmin !== undefined ? user.isAdmin : await isCurrentUserAdmin();
          if (!mounted) return;
          setIsAdmin(adminStatus);
          
          if (!adminStatus) {
            // Rediriger si pas admin
            navigation.goBack();
          } else {
            await loadBans();
          }
        } else {
          navigation.navigate('Login' as never);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification admin:', error);
        if (mounted) {
          setIsAdmin(false);
          navigation.goBack();
        }
      }
    }
    checkAdmin();
    return () => { mounted = false; };
  }, [user?.id, user?.isAdmin, navigation]);

  async function loadBans() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_bans')
        .select('*')
        .order('banned_at', { ascending: false });

      if (error) {
        // Si la table n'existe pas encore, continuer sans erreur
        if (error.message?.includes('does not exist') || 
            error.code === '42P01' || 
            error.message?.includes('relation') ||
            error.message?.includes('permission denied')) {
          console.warn('La table user_bans n\'existe pas encore ou permissions insuffisantes.');
          setBans([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      setBans(data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des bannissements:', error);
      setBans([]);
    } finally {
      setLoading(false);
    }
  }

  async function unbanUser(banId: string, userId: string, userEmail: string) {
    if (!supabase || !isAdmin) {
      return;
    }

    Alert.alert(
      'Débannir l\'utilisateur',
      `Êtes-vous sûr de vouloir débannir cet utilisateur ?\n\nEmail: ${userEmail}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Débannir',
          style: 'destructive',
          onPress: async () => {
            setUnbanning(banId);

            try {
              // Utiliser la fonction RPC pour débannir
              const { error: rpcError } = await supabase.rpc('unban_user', { user_uuid: userId });
              
              if (rpcError) {
                // Si la fonction RPC n'existe pas, faire manuellement
                if (rpcError.message?.includes('function') || 
                    rpcError.code === '42883' ||
                    rpcError.message?.includes('does not exist')) {
                  // Supprimer le bannissement manuellement
                  const { error: deleteBanError } = await supabase
                    .from('user_bans')
                    .delete()
                    .eq('id', banId);

                  if (deleteBanError) {
                    // Si la table n'existe pas, continuer sans erreur
                    if (deleteBanError.message?.includes('does not exist') || deleteBanError.code === '42P01') {
                      console.warn('La table user_bans n\'existe pas encore');
                    } else {
                      throw deleteBanError;
                    }
                  }

                  // Supprimer l'email de la liste des emails bannis
                  try {
                    const { error: deleteEmailError } = await supabase
                      .from('banned_emails')
                      .delete()
                      .eq('email', userEmail.toLowerCase());

                    if (deleteEmailError) {
                      // Si la table n'existe pas, continuer sans erreur
                      if (deleteEmailError.message?.includes('does not exist') || deleteEmailError.code === '42P01') {
                        console.warn('La table banned_emails n\'existe pas encore');
                      } else {
                        console.warn('Erreur lors de la suppression de l\'email banni:', deleteEmailError);
                      }
                    }
                  } catch (emailError) {
                    console.warn('Erreur lors de la suppression de l\'email:', emailError);
                  }
                } else {
                  throw rpcError;
                }
              }

              // Recharger la liste
              await loadBans();
              Alert.alert('Succès', 'Utilisateur débanni avec succès !');
            } catch (error: any) {
              console.error('Erreur lors du débannissement:', error);
              Alert.alert('Erreur', 'Erreur lors du débannissement. Veuillez réessayer.');
            } finally {
              setUnbanning(null);
            }
          },
        },
      ]
    );
  }

  function formatDate(dateString: string | null): string {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleString('fr-FR');
  }

  function getTimeRemaining(expiresAt: string | null): string {
    if (!expiresAt) return 'Permanent';
    
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expiré';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}min restantes`;
    }
    return `${minutes}min restantes`;
  }

  if (!isAdmin) {
    return (
      <View style={styles.wrapper}>
        <LinearGradient
          colors={[theme.colors.background, theme.colors.backgroundSecondary]}
          style={StyleSheet.absoluteFill}
        />
        <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
        <SafeAreaView style={styles.container}>
          <View style={styles.errorContainer}>
            <AlertCircle size={64} color="#ff6b6b" />
            <Text style={[styles.errorTitle, { color: theme.colors.text }]}>
              Accès refusé
            </Text>
            <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>
              Vous devez être administrateur pour accéder à cette page.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.backgroundSecondary]}
        style={StyleSheet.absoluteFill}
      />
      <GalaxyBackground starCount={100} minSize={1} maxSize={2} />
      
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed
            ]}
          >
            <ArrowLeft size={24} color={theme.colors.text} />
          </Pressable>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Gestion des bannissements
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.accent} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Chargement des bannissements...
              </Text>
            </View>
          ) : bans.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
              <Ban size={64} color={theme.colors.textSecondary + '66'} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                Aucun bannissement actif
              </Text>
            </View>
          ) : (
            <View style={styles.bansList}>
              {bans.map((ban) => (
                <View
                  key={ban.id}
                  style={[styles.banCard, { backgroundColor: theme.colors.backgroundSecondary }]}
                >
                  <View style={styles.banContent}>
                    <View style={styles.banHeader}>
                      {ban.ban_type === 'permanent' ? (
                        <Ban size={24} color="#ff6b6b" />
                      ) : (
                        <Clock size={24} color="#ffa500" />
                      )}
                      <View style={styles.banInfo}>
                        <Text style={[styles.banEmail, { color: theme.colors.text }]}>
                          {ban.user_email}
                        </Text>
                        <Text style={[styles.banDate, { color: theme.colors.textSecondary }]}>
                          Banni le {formatDate(ban.banned_at)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.banDetails}>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                          Type:
                        </Text>
                        <View style={[
                          styles.badge,
                          {
                            backgroundColor: ban.ban_type === 'permanent' 
                              ? '#ff6b6b33' 
                              : '#ffa50033'
                          }
                        ]}>
                          <Text style={[
                            styles.badgeText,
                            {
                              color: ban.ban_type === 'permanent' ? '#ff6b6b' : '#ffa500'
                            }
                          ]}>
                            {ban.ban_type === 'permanent' ? 'Définitif' : 'Temporaire'}
                          </Text>
                        </View>
                      </View>

                      {ban.ban_type === 'temporary' && (
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                            Durée:
                          </Text>
                          <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                            {ban.duration_minutes} minutes
                          </Text>
                        </View>
                      )}

                      {ban.expires_at && (
                        <View style={styles.detailRow}>
                          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                            Expire:
                          </Text>
                          <Text style={[styles.detailValue, { color: theme.colors.textSecondary }]}>
                            {formatDate(ban.expires_at)} ({getTimeRemaining(ban.expires_at)})
                          </Text>
                        </View>
                      )}

                      {ban.reason && (
                        <View style={styles.reasonContainer}>
                          <Text style={[styles.detailLabel, { color: theme.colors.textSecondary }]}>
                            Raison:
                          </Text>
                          <Text style={[styles.reasonText, { color: theme.colors.textSecondary }]}>
                            {ban.reason}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Pressable
                    onPress={() => unbanUser(ban.id, ban.user_id, ban.user_email)}
                    disabled={unbanning === ban.id}
                    style={({ pressed }) => [
                      styles.unbanButton,
                      { backgroundColor: '#10b981' },
                      (pressed || unbanning === ban.id) && styles.buttonPressed
                    ]}
                  >
                    {unbanning === ban.id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <X size={16} color="#ffffff" />
                        <Text style={styles.unbanButtonText}>Débannir</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'System',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'System',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'System',
    textAlign: 'center',
  },
  emptyCard: {
    borderRadius: 16,
    padding: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'System',
    marginTop: 16,
  },
  bansList: {
    gap: 16,
  },
  banCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  banContent: {
    flex: 1,
  },
  banHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  banInfo: {
    flex: 1,
  },
  banEmail: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'System',
  },
  banDate: {
    fontSize: 14,
    fontFamily: 'System',
    marginTop: 4,
  },
  banDetails: {
    marginLeft: 36,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'System',
  },
  detailValue: {
    fontSize: 14,
    fontFamily: 'System',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'System',
  },
  reasonContainer: {
    marginTop: 8,
  },
  reasonText: {
    fontSize: 14,
    fontFamily: 'System',
    marginTop: 4,
  },
  unbanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  unbanButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
  },
});

