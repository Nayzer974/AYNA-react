import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '@/contexts/UserContext';
import { getTheme } from '@/data/themes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ban, X, Clock, AlertCircle, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GalaxyBackground } from '@/components/GalaxyBackground';
import { supabase, isCurrentUserAdmin } from '@/services/auth/supabase';
import { ConfirmationModal } from '@/components/ui';

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

interface SearchResult {
  id: string;
  name: string | null;
  email: string | null;
  avatar?: string | null;
  banned: boolean;
  ban?: BanRecord | null;
}

export function AdminBans() {
  const navigation = useNavigation();
  const { user } = useUser();
  const theme = getTheme(user?.theme || 'default');
  const [isAdmin, setIsAdmin] = useState(false);
  const [bans, setBans] = useState<BanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [unbanning, setUnbanning] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingAllUsers, setLoadingAllUsers] = useState(false);
  const [allUsers, setAllUsers] = useState<SearchResult[]>([]);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [usersPage, setUsersPage] = useState(0);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [banModal, setBanModal] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string | null;
    banType: 'temporary' | 'permanent' | null;
    durationMinutes: number;
  }>({
    isOpen: false,
    userId: null,
    userName: null,
    banType: null,
    durationMinutes: 60,
  });

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
        // Erreur silencieuse en production
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
        .eq('banned_by', user?.id || '')
        .order('banned_at', { ascending: false });

      if (error) {
        // Si la table n'existe pas encore, continuer sans erreur
        if (error.message?.includes('does not exist') || 
            error.code === '42P01' || 
            error.message?.includes('relation') ||
            error.message?.includes('permission denied')) {
          // Table non disponible
          setBans([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      setBans(data || []);
    } catch (error: any) {
      // Erreur silencieuse en production
      setBans([]);
    } finally {
      setLoading(false);
    }
  }

  async function searchUsers() {
    if (!supabase || !searchQuery.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const q = searchQuery.trim();
      
      // ✅ Rechercher dans toute la base de données (profiles)
      // Recherche par nom, email ou ID (même partiel)
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar')
        .or(`name.ilike.%${q}%,email.ilike.%${q}%,id.ilike.%${q}%`)
        .limit(50); // Augmenter la limite pour plus de résultats

      if (error) throw error;

      const profileIds = (profiles || []).map((p) => p.id);
      let bansMap: Record<string, BanRecord | null> = {};

      // ✅ Vérifier les bannissements pour tous les profils trouvés (bannis ou non)
      if (profileIds.length > 0) {
        const { data: bansData, error: bansError } = await supabase
          .from('user_bans')
          .select('*')
          .in('user_id', profileIds);
        if (!bansError && bansData) {
          bansMap = bansData.reduce((acc, ban) => {
            acc[ban.user_id] = ban;
            return acc;
          }, {} as Record<string, BanRecord>);
        }
      }

      // ✅ Mapper tous les résultats (bannis ou non)
      const mapped: SearchResult[] = (profiles || []).map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        banned: !!bansMap[p.id],
        ban: bansMap[p.id] || null,
      }));

      setResults(mapped);
      setShowAllUsers(false); // Afficher les résultats de recherche
    } catch (e) {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function loadAllUsers(reset: boolean = false) {
    if (!supabase || !isAdmin || !user?.id) {
      return;
    }

    setLoadingAllUsers(true);
    try {
      const page = reset ? 0 : usersPage;
      const pageSize = 50;

      // ✅ Obtenir l'ID utilisateur depuis la session Supabase (plus fiable)
      let userId = user.id;
      
      // Si user.id n'est pas disponible, essayer de le récupérer depuis la session
      if (!userId) {
        try {
          const { data: { user: sessionUser } } = await supabase.auth.getUser();
          if (sessionUser?.id) {
            userId = sessionUser.id;
          } else {
            // Fallback : essayer getSession
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
              userId = session.user.id;
            }
          }
        } catch (e) {
          console.error('[AdminBans] Erreur lors de la récupération de l\'ID utilisateur:', e);
        }
      }

      if (!userId) {
        throw new Error('Impossible de récupérer l\'ID utilisateur');
      }

      // ✅ Utiliser la fonction RPC sécurisée pour contourner RLS
      // Cette fonction garantit que tous les utilisateurs sont accessibles aux admins
      const { data: profiles, error } = await supabase.rpc('get_all_users_for_admin', {
        p_user_id: userId,
        p_page: page,
        p_page_size: pageSize,
      });

      if (error) {
        // Si la fonction RPC n'existe pas, utiliser la méthode directe (fallback)
        if (error.message?.includes('function') || 
            error.message?.includes('does not exist') || 
            error.code === '42883') {
          console.warn('[AdminBans] Fonction RPC non disponible, utilisation du fallback');
          
          const from = page * pageSize;
          const to = from + pageSize - 1;
          
          const { data: fallbackProfiles, error: fallbackError } = await supabase
            .from('profiles')
            .select('id, name, email, avatar')
            .order('created_at', { ascending: false })
            .range(from, to);

          if (fallbackError) throw fallbackError;
          
          // Mapper les résultats du fallback
          const profileIds = (fallbackProfiles || []).map((p) => p.id);
          let bansMap: Record<string, BanRecord | null> = {};

          if (profileIds.length > 0) {
            const { data: bansData, error: bansError } = await supabase
              .from('user_bans')
              .select('*')
              .in('user_id', profileIds);
            if (!bansError && bansData) {
              bansMap = bansData.reduce((acc, ban) => {
                acc[ban.user_id] = ban;
                return acc;
              }, {} as Record<string, BanRecord>);
            }
          }

          const mapped: SearchResult[] = (fallbackProfiles || []).map((p) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            avatar: p.avatar,
            banned: !!bansMap[p.id],
            ban: bansMap[p.id] || null,
          }));

          if (reset) {
            setAllUsers(mapped);
            setUsersPage(1);
          } else {
            setAllUsers((prev) => [...prev, ...mapped]);
            setUsersPage(page + 1);
          }

          setHasMoreUsers((fallbackProfiles || []).length === pageSize);
          setLoadingAllUsers(false);
          return;
        }
        throw error;
      }

      // Les données de la RPC sont déjà formatées
      const profileIds = (profiles || []).map((p) => p.id);
      let bansMap: Record<string, BanRecord | null> = {};

      // Vérifier les bannissements pour tous les profils
      if (profileIds.length > 0) {
        const { data: bansData, error: bansError } = await supabase
          .from('user_bans')
          .select('*')
          .in('user_id', profileIds);
        if (!bansError && bansData) {
          bansMap = bansData.reduce((acc, ban) => {
            acc[ban.user_id] = ban;
            return acc;
          }, {} as Record<string, BanRecord>);
        }
      }

      // Mapper les résultats de la RPC
      const mapped: SearchResult[] = (profiles || []).map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        avatar: p.avatar,
        banned: !!bansMap[p.id],
        ban: bansMap[p.id] || null,
      }));

      if (reset) {
        setAllUsers(mapped);
        setUsersPage(1);
      } else {
        setAllUsers((prev) => [...prev, ...mapped]);
        setUsersPage(page + 1);
      }

      // Vérifier s'il y a plus d'utilisateurs à charger
      setHasMoreUsers((profiles || []).length === pageSize);
    } catch (e) {
      console.error('[AdminBans] Erreur lors du chargement de tous les utilisateurs:', e);
      setAllUsers([]);
    } finally {
      setLoadingAllUsers(false);
    }
  }

  function handleShowAllUsers() {
    setShowAllUsers(true);
    setResults([]);
    setSearchQuery('');
    if (allUsers.length === 0) {
      loadAllUsers(true);
    }
  }

  function handleShowSearch() {
    setShowAllUsers(false);
    setAllUsers([]);
    setUsersPage(0);
    setHasMoreUsers(true);
  }

  async function unbanUser(banId: string, userId: string, userEmail: string) {
    if (!supabase || !isAdmin) {
      return;
    }

    setUnbanData({ banId, userId, userEmail });
    setShowUnbanModal(true);
  }

  const handleConfirmUnban = async () => {
    if (!unbanData || !supabase || !isAdmin) return;
    
    const { banId, userId, userEmail } = unbanData;
    setShowUnbanModal(false);
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
              // Table non disponible
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
                // Table non disponible
              } else {
                // Erreur silencieuse en production
              }
            }
          } catch (emailError) {
            // Erreur silencieuse en production
          }
        } else {
          throw rpcError;
        }
      }

      // Recharger la liste
      await loadBans();
      Alert.alert('Succès', 'Utilisateur débanni avec succès !');
    } catch (error: any) {
      // Erreur silencieuse en production
      Alert.alert('Erreur', 'Erreur lors du débannissement. Veuillez réessayer.');
    } finally {
      setUnbanning(null);
      setUnbanData(null);
    }
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

  async function executeBan() {
    if (!supabase || !isAdmin || !banModal.userId || !banModal.userName || !banModal.banType) {
      return;
    }

    try {
      const userId = banModal.userId;
      const userName = banModal.userName;
      const banType = banModal.banType;
      const durationMinutes = banModal.durationMinutes;

      // Récupérer l'email de l'utilisateur
      let userEmail = 'unknown@example.com';
      
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .single();
        
        if (!profileError && profileData?.email) {
          userEmail = profileData.email;
        } else {
          // Essayer via auth.users si disponible
          const { data: emailData, error: emailError } = await supabase
            .rpc('get_user_email', { user_uuid: userId });
          
          if (!emailError && emailData) {
            userEmail = emailData;
          } else {
            userEmail = `${userId}@banned.local`;
          }
        }
      } catch (e) {
        userEmail = `${userId}@banned.local`;
      }

      // ✅ Obtenir l'ID utilisateur admin depuis la session Supabase
      let adminUserId = user?.id;
      
      if (!adminUserId) {
        try {
          const { data: { user: sessionUser } } = await supabase.auth.getUser();
          if (sessionUser?.id) {
            adminUserId = sessionUser.id;
          } else {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
              adminUserId = session.user.id;
            }
          }
        } catch (e) {
          console.error('[AdminBans] Erreur lors de la récupération de l\'ID admin:', e);
        }
      }

      if (!adminUserId) {
        throw new Error('Impossible de récupérer l\'ID administrateur');
      }

      // ✅ Utiliser la fonction RPC sécurisée pour bannir (contourne RLS)
      const { data: banId, error: banRpcError } = await supabase.rpc('ban_user', {
        p_admin_user_id: adminUserId,
        p_target_user_id: userId,
        p_user_email: userEmail,
        p_ban_type: banType,
        p_duration_minutes: banType === 'temporary' ? durationMinutes : null,
        p_reason: banType === 'permanent' 
          ? 'Bannissement définitif par admin'
          : `Bannissement temporaire de ${durationMinutes} minutes`,
      });

      if (banRpcError) {
        // Si la fonction RPC n'existe pas, utiliser la méthode directe (fallback)
        if (banRpcError.message?.includes('function') || 
            banRpcError.message?.includes('does not exist') || 
            banRpcError.code === '42883') {
          console.warn('[AdminBans] Fonction RPC ban_user non disponible, utilisation du fallback');
          
          // Fallback : méthode directe
          if (banType === 'permanent') {
            // Bannissement définitif
            // 1. Supprimer tous les posts de l'utilisateur
            const { error: postsError } = await supabase
              .from('community_posts')
              .delete()
              .eq('user_id', userId);

            if (postsError) throw postsError;

            // 2. Supprimer tous les likes de l'utilisateur
            const { error: likesError } = await supabase
              .from('community_post_likes')
              .delete()
              .eq('user_id', userId);

            if (likesError) {
              // Erreur silencieuse en production
            }

            // 3. Créer un enregistrement de bannissement
            const { error: banError } = await supabase
              .from('user_bans')
              .insert([{
                user_id: userId,
                user_email: userEmail,
                ban_type: 'permanent',
                duration_minutes: null,
                expires_at: null,
                banned_by: adminUserId,
                reason: 'Bannissement définitif par admin'
              }]);

            if (banError) throw banError;

            // 4. Bannir l'email
            const { error: emailBanError } = await supabase
              .from('banned_emails')
              .insert([{
                email: userEmail.toLowerCase(),
                banned_by: adminUserId,
                reason: 'Bannissement définitif par admin'
              }])
              .select();

            if (emailBanError) {
              // Si l'email existe déjà, ignorer l'erreur
              if (!emailBanError.message?.includes('duplicate') && !emailBanError.code?.includes('23505')) {
                // Erreur silencieuse en production
              }
            }

            Alert.alert(
              'Succès',
              `L'utilisateur "${userName}" a été banni définitivement.\n\nSon compte et son email ont été bannis.`
            );
          } else {
            // Bannissement temporaire
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

            // 1. Créer l'enregistrement de bannissement
            const { error: banError } = await supabase
              .from('user_bans')
              .insert([{
                user_id: userId,
                user_email: userEmail,
                ban_type: 'temporary',
                duration_minutes: durationMinutes,
                expires_at: expiresAt.toISOString(),
                banned_by: adminUserId,
                reason: `Bannissement temporaire de ${durationMinutes} minutes`
              }]);

            if (banError) throw banError;

            // 2. Supprimer tous les posts de l'utilisateur
            const { error: postsError } = await supabase
              .from('community_posts')
              .delete()
              .eq('user_id', userId);

            if (postsError) throw postsError;

            // 3. Supprimer tous les likes de l'utilisateur
            const { error: likesError } = await supabase
              .from('community_post_likes')
              .delete()
              .eq('user_id', userId);

            if (likesError) {
              // Erreur silencieuse en production
            }

            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            const durationText =
              hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}` : `${minutes}min`;

            Alert.alert(
              'Succès',
              `L'utilisateur "${userName}" a été banni temporairement pour ${durationText}.\n\nTous ses posts ont été supprimés.`
            );
          }
        } else {
          throw banRpcError;
        }
      } else {
        // ✅ Succès avec la fonction RPC
        if (banType === 'permanent') {
          Alert.alert(
            'Succès',
            `L'utilisateur "${userName}" a été banni définitivement.\n\nSon compte et son email ont été bannis.`
          );
        } else {
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          const durationText =
            hours > 0 ? `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}` : `${minutes}min`;

          Alert.alert(
            'Succès',
            `L'utilisateur "${userName}" a été banni temporairement pour ${durationText}.\n\nTous ses posts ont été supprimés.`
          );
        }
      }

      // Recharger les données
      await loadBans();
      if (showAllUsers) {
        // Recharger tous les utilisateurs si on est en mode "tous les utilisateurs"
        await loadAllUsers(true);
      } else {
        // Recharger les résultats de recherche si on est en mode recherche
        await searchUsers();
      }
      setBanModal({
        isOpen: false,
        userId: null,
        userName: null,
        banType: null,
        durationMinutes: 60,
      });
    } catch (error: any) {
      console.error('[AdminBans] Erreur lors du bannissement:', error);
      Alert.alert('Erreur', 'Erreur lors du bannissement. Veuillez réessayer.');
    }
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
          {/* Barre de recherche */}
          <View style={[styles.searchCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
            <View style={styles.searchHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                {showAllUsers ? 'Tous les utilisateurs' : 'Rechercher un utilisateur'}
              </Text>
              {!showAllUsers && (
                <Pressable
                  onPress={handleShowAllUsers}
                  style={({ pressed }) => [
                    styles.showAllButton,
                    { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.showAllButtonText, { color: theme.colors.accent }]}>
                    Voir tous
                  </Text>
                </Pressable>
              )}
              {showAllUsers && (
                <Pressable
                  onPress={handleShowSearch}
                  style={({ pressed }) => [
                    styles.showAllButton,
                    { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                    pressed && styles.buttonPressed,
                  ]}
                >
                  <Text style={[styles.showAllButtonText, { color: theme.colors.accent }]}>
                    Rechercher
                  </Text>
                </Pressable>
              )}
            </View>
            {!showAllUsers && (
              <>
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Pseudo, email ou UID"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  style={[
                    styles.searchInput,
                    {
                      color: theme.colors.text,
                      borderColor: 'rgba(255,255,255,0.1)',
                      backgroundColor: 'rgba(255,255,255,0.05)',
                    },
                  ]}
                  onSubmitEditing={searchUsers}
                  returnKeyType="search"
                />
                <Pressable
                  onPress={searchUsers}
                  style={({ pressed }) => [
                    styles.searchButton,
                    { backgroundColor: theme.colors.accent },
                    pressed && styles.buttonPressed,
                  ]}
                >
                  {searching ? (
                    <ActivityIndicator size="small" color="#0A0F2C" />
                  ) : (
                    <Text style={[styles.searchButtonText, { color: '#0A0F2C' }]}>Rechercher</Text>
                  )}
                </Pressable>
              </>
            )}

            {showAllUsers && loadingAllUsers && allUsers.length === 0 && (
              <View style={styles.loadingUsersContainer}>
                <ActivityIndicator size="large" color={theme.colors.accent} />
                <Text style={[styles.loadingUsersText, { color: theme.colors.textSecondary }]}>
                  Chargement des utilisateurs...
                </Text>
              </View>
            )}

            {(results.length > 0 || (showAllUsers && allUsers.length > 0)) && (
              <View style={styles.resultsList}>
                {(showAllUsers ? allUsers : results).map((r) => (
                  <View
                    key={r.id}
                    style={[styles.resultItem, { borderColor: 'rgba(255,255,255,0.08)' }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { color: theme.colors.text }]}>
                        {r.name || 'Utilisateur'}
                      </Text>
                      <Text style={[styles.resultEmail, { color: theme.colors.textSecondary }]}>
                        {r.email || 'Email inconnu'}
                      </Text>
                      <Text style={[styles.resultMeta, { color: theme.colors.textSecondary }]}>
                        UID: {r.id}
                      </Text>
                      {r.ban?.reason && (
                        <Text style={[styles.resultReason, { color: '#f97316' }]}>
                          Raison: {r.ban.reason}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      onPress={() => {
                        if (r.banned && r.ban?.id) {
                          unbanUser(r.ban.id, r.id, r.email || '');
                        } else {
                          // ✅ Ouvrir la modale de bannissement pour les utilisateurs non bannis
                          setBanModal({
                            isOpen: true,
                            userId: r.id,
                            userName: r.name || r.email || 'Utilisateur',
                            banType: null,
                            durationMinutes: 60,
                          });
                        }
                      }}
                      style={({ pressed }) => [
                        styles.resultAction,
                        {
                          backgroundColor: r.banned ? '#10b981' : '#ef4444',
                        },
                        pressed && styles.buttonPressed,
                      ]}
                    >
                      <Text style={styles.resultActionText}>
                        {r.banned ? 'Débannir' : 'Bannir'}
                      </Text>
                    </Pressable>
                  </View>
                ))}
                {showAllUsers && hasMoreUsers && (
                  <Pressable
                    onPress={() => loadAllUsers(false)}
                    disabled={loadingAllUsers}
                    style={({ pressed }) => [
                      styles.loadMoreButton,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        opacity: loadingAllUsers ? 0.5 : 1,
                      },
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    {loadingAllUsers ? (
                      <ActivityIndicator size="small" color={theme.colors.accent} />
                    ) : (
                      <Text style={[styles.loadMoreButtonText, { color: theme.colors.accent }]}>
                        Charger plus d'utilisateurs
                      </Text>
                    )}
                  </Pressable>
                )}
                {showAllUsers && !hasMoreUsers && allUsers.length > 0 && (
                  <View style={styles.noMoreUsersContainer}>
                    <Text style={[styles.noMoreUsersText, { color: theme.colors.textSecondary }]}>
                      Tous les utilisateurs ont été chargés ({allUsers.length} au total)
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

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

      {/* Modal de bannissement */}
      <Modal
        visible={banModal.isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setBanModal({ ...banModal, isOpen: false })}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setBanModal({ ...banModal, isOpen: false })}
        >
          <Pressable
            style={[styles.modalContent, { backgroundColor: theme.colors.backgroundSecondary }]}
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
              Bannir l'utilisateur
            </Text>
            <Text style={[styles.modalText, { color: theme.colors.textSecondary }]}>
              Vous êtes sur le point de bannir <Text style={{ fontWeight: 'bold' }}>{banModal.userName}</Text>
            </Text>

            {/* Type de bannissement */}
            <View style={styles.modalSection}>
              <Text style={[styles.modalLabel, { color: theme.colors.text }]}>
                Type de bannissement
              </Text>
              <View style={styles.radioGroup}>
                <Pressable
                  onPress={() => setBanModal({ ...banModal, banType: 'temporary' })}
                  style={styles.radioOption}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          banModal.banType === 'temporary'
                            ? theme.colors.accent
                            : 'rgba(255, 255, 255, 0.2)',
                      },
                    ]}
                  >
                    {banModal.banType === 'temporary' && (
                      <View style={[styles.radioInner, { backgroundColor: theme.colors.accent }]} />
                    )}
                  </View>
                  <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Temporaire</Text>
                </Pressable>
                <Pressable
                  onPress={() => setBanModal({ ...banModal, banType: 'permanent' })}
                  style={styles.radioOption}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor:
                          banModal.banType === 'permanent'
                            ? theme.colors.accent
                            : 'rgba(255, 255, 255, 0.2)',
                      },
                    ]}
                  >
                    {banModal.banType === 'permanent' && (
                      <View style={[styles.radioInner, { backgroundColor: theme.colors.accent }]} />
                    )}
                  </View>
                  <Text style={[styles.radioLabel, { color: theme.colors.text }]}>Définitif</Text>
                </Pressable>
              </View>
            </View>

            {/* Durée (si temporaire) */}
            {banModal.banType === 'temporary' && (
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: theme.colors.text }]}>
                  Durée (en minutes)
                </Text>
                <TextInput
                  value={banModal.durationMinutes.toString()}
                  onChangeText={(text) =>
                    setBanModal({ ...banModal, durationMinutes: parseInt(text) || 60 })
                  }
                  keyboardType="numeric"
                  style={[
                    styles.modalInput,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: theme.colors.text,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  ]}
                />
                <Text style={[styles.modalHint, { color: theme.colors.textSecondary }]}>
                  {banModal.durationMinutes >= 60
                    ? `${Math.floor(banModal.durationMinutes / 60)}h${
                        banModal.durationMinutes % 60 > 0
                          ? ` ${banModal.durationMinutes % 60}min`
                          : ''
                      }`
                    : `${banModal.durationMinutes}min`}
                </Text>
              </View>
            )}

            {/* Avertissement pour bannissement définitif */}
            {banModal.banType === 'permanent' && (
              <View
                style={[
                  styles.modalWarning,
                  {
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                  },
                ]}
              >
                <Text style={[styles.modalWarningText, { color: '#ef4444' }]}>
                  ⚠️ Le bannissement définitif supprimera le compte de l'utilisateur et bannira son email. Cette action est irréversible.
                </Text>
              </View>
            )}

            {/* Boutons */}
            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setBanModal({ ...banModal, isOpen: false })}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonCancel,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.modalButtonText, { color: theme.colors.text }]}>
                  Annuler
                </Text>
              </Pressable>
              <Pressable
                onPress={executeBan}
                disabled={!banModal.banType || (banModal.banType === 'temporary' && banModal.durationMinutes < 1)}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonConfirm,
                  {
                    backgroundColor: '#ef4444',
                    opacity:
                      !banModal.banType ||
                      (banModal.banType === 'temporary' && banModal.durationMinutes < 1)
                        ? 0.5
                        : 1,
                  },
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.modalButtonText, { color: '#ffffff' }]}>
                  {banModal.banType === 'permanent' ? 'Bannir définitivement' : 'Bannir temporairement'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
      
      <ConfirmationModal
        visible={showUnbanModal}
        title="Débannir l'utilisateur"
        message={unbanData ? `Êtes-vous sûr de vouloir débannir cet utilisateur ?\n\nEmail: ${unbanData.userEmail}` : ''}
        confirmText="Débannir"
        cancelText="Annuler"
        onConfirm={handleConfirmUnban}
        onCancel={() => {
          setShowUnbanModal(false);
          setUnbanData(null);
        }}
        confirmVariant="destructive"
      />
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
  searchCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    fontFamily: 'System',
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'System',
  },
  searchButton: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'System',
  },
  resultsList: {
    marginTop: 12,
    gap: 8,
  },
  resultItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  resultName: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'System',
  },
  resultEmail: {
    fontSize: 13,
    fontFamily: 'System',
    marginTop: 2,
  },
  resultMeta: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 2,
  },
  resultReason: {
    fontSize: 12,
    fontFamily: 'System',
    marginTop: 4,
  },
  resultAction: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resultActionText: {
    color: '#0A0F2C',
    fontWeight: '700',
    fontSize: 13,
    fontFamily: 'System',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'System',
  },
  modalText: {
    fontSize: 14,
    marginBottom: 24,
    fontFamily: 'System',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: 'System',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  radioLabel: {
    fontSize: 14,
    fontFamily: 'System',
  },
  modalInput: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    marginBottom: 8,
    fontFamily: 'System',
  },
  modalHint: {
    fontSize: 12,
    fontFamily: 'System',
  },
  modalWarning: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  modalWarningText: {
    fontSize: 12,
    fontFamily: 'System',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {},
  modalButtonConfirm: {},
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  showAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  showAllButtonText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'System',
  },
  loadingUsersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  loadingUsersText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'System',
  },
  loadMoreButton: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'System',
  },
  noMoreUsersContainer: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  noMoreUsersText: {
    fontSize: 12,
    fontFamily: 'System',
  },
});

