import { View, Text, StyleSheet, Pressable, Platform, ScrollView, Alert } from 'react-native';
import {
  User,
  Crown,
  Moon,
  Sun,
  Monitor,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  Mail,
  Shield,
  FileText,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { useSubscription } from '@/lib/subscription-context';

export default function ProfileScreen() {
  const { colors, preference, setPreference, isDark } = useTheme();
  const { user, profile, signOut } = useAuth();
  const { isPremium } = useSubscription();
  const router = useRouter();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (!user) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[s.title, { color: colors.textPrimary }]}>Profile</Text>
        </View>
        <View style={s.signInContainer}>
          <View style={[s.avatarPlaceholder, { backgroundColor: colors.surfaceElevated }]}>
            <User size={40} color={colors.textTertiary} strokeWidth={1.5} />
          </View>
          <Text style={[s.signInTitle, { color: colors.textPrimary }]}>
            Welcome to FeedStream
          </Text>
          <Text style={[s.signInSub, { color: colors.textSecondary }]}>
            Sign in to sync your bookmarks, preferences, and premium access
          </Text>
          <Pressable
            onPress={() => router.push('/auth/login')}
            style={({ pressed }) => [
              s.primaryBtn,
              { backgroundColor: colors.textPrimary },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[s.primaryBtnText, { color: colors.surface }]}>Sign In</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/auth/register')}
            style={({ pressed }) => [
              s.secondaryBtn,
              { borderColor: colors.border },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[s.secondaryBtnText, { color: colors.textPrimary }]}>Create Account</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Profile</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* User Info */}
        <View style={[s.userCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[s.avatar, { backgroundColor: colors.gold }]}>
            <Text style={s.avatarText}>
              {(profile?.full_name || profile?.email || 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={s.userInfo}>
            <Text style={[s.userName, { color: colors.textPrimary }]} numberOfLines={1}>
              {profile?.full_name || 'Reader'}
            </Text>
            <Text style={[s.userEmail, { color: colors.textSecondary }]} numberOfLines={1}>
              {profile?.email}
            </Text>
            {isPremium ? (
              <View style={[s.premiumBadge, { backgroundColor: colors.gold + '20' }]}>
                <Crown size={12} color={colors.gold} strokeWidth={2} />
                <Text style={[s.premiumText, { color: colors.gold }]}>PREMIUM</Text>
              </View>
            ) : (
              <Pressable
                onPress={() => router.push('/paywall')}
                style={({ pressed }) => [
                  s.upgradeBtn,
                  { backgroundColor: colors.gold },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Crown size={12} color="#000" strokeWidth={2} />
                <Text style={s.upgradeText}>Upgrade to Premium</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Appearance Section */}
        <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>APPEARANCE</Text>
        <View style={[s.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.themeRow}>
            <Pressable
              onPress={() => setPreference('light')}
              style={[
                s.themeOption,
                preference === 'light' && { backgroundColor: colors.gold + '20' },
              ]}
            >
              <Sun size={18} color={preference === 'light' ? colors.gold : colors.textSecondary} strokeWidth={2} />
              <Text
                style={[
                  s.themeText,
                  { color: preference === 'light' ? colors.textPrimary : colors.textSecondary },
                ]}
              >
                Light
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPreference('dark')}
              style={[
                s.themeOption,
                preference === 'dark' && { backgroundColor: colors.gold + '20' },
              ]}
            >
              <Moon size={18} color={preference === 'dark' ? colors.gold : colors.textSecondary} strokeWidth={2} />
              <Text
                style={[
                  s.themeText,
                  { color: preference === 'dark' ? colors.textPrimary : colors.textSecondary },
                ]}
              >
                Dark
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPreference('system')}
              style={[
                s.themeOption,
                preference === 'system' && { backgroundColor: colors.gold + '20' },
              ]}
            >
              <Monitor size={18} color={preference === 'system' ? colors.gold : colors.textSecondary} strokeWidth={2} />
              <Text
                style={[
                  s.themeText,
                  { color: preference === 'system' ? colors.textPrimary : colors.textSecondary },
                ]}
              >
                Auto
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Settings Section */}
        <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>SETTINGS</Text>
        <View style={[s.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Pressable
            onPress={() => router.push('/notifications')}
            style={({ pressed }) => [s.settingRow, pressed && { opacity: 0.7 }]}
          >
            <View style={s.settingLeft}>
              <Bell size={20} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[s.settingText, { color: colors.textPrimary }]}>Notifications</Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} />
          </Pressable>
          <View style={[s.settingDivider, { backgroundColor: colors.border }]} />
          <Pressable style={({ pressed }) => [s.settingRow, pressed && { opacity: 0.7 }]}>
            <View style={s.settingLeft}>
              <Shield size={20} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[s.settingText, { color: colors.textPrimary }]}>Privacy</Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} />
          </Pressable>
          <View style={[s.settingDivider, { backgroundColor: colors.border }]} />
          <Pressable style={({ pressed }) => [s.settingRow, pressed && { opacity: 0.7 }]}>
            <View style={s.settingLeft}>
              <FileText size={20} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[s.settingText, { color: colors.textPrimary }]}>Terms & Policies</Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} />
          </Pressable>
          <View style={[s.settingDivider, { backgroundColor: colors.border }]} />
          <Pressable style={({ pressed }) => [s.settingRow, pressed && { opacity: 0.7 }]}>
            <View style={s.settingLeft}>
              <HelpCircle size={20} color={colors.textSecondary} strokeWidth={2} />
              <Text style={[s.settingText, { color: colors.textPrimary }]}>Help & Support</Text>
            </View>
            <ChevronRight size={18} color={colors.textTertiary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          style={({ pressed }) => [
            s.signOutBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
            pressed && { opacity: 0.7 },
          ]}
        >
          <LogOut size={20} color={colors.error} strokeWidth={2} />
          <Text style={[s.signOutText, { color: colors.error }]}>Sign Out</Text>
        </Pressable>

        <Text style={[s.version, { color: colors.textTertiary }]}>FeedStream v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
  },
  signInContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signInTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 10,
  },
  signInSub: {
    fontFamily: 'Inter',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 28,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    color: '#000',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 18,
    marginBottom: 2,
  },
  userEmail: {
    fontFamily: 'Inter',
    fontSize: 13,
    marginBottom: 10,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  upgradeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#000',
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  settingsGroup: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 28,
    overflow: 'hidden',
  },
  themeRow: {
    flexDirection: 'row',
    padding: 8,
    gap: 4,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  themeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontFamily: 'Inter',
    fontSize: 15,
  },
  settingDivider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 48,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  signOutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  version: {
    fontFamily: 'Inter',
    fontSize: 12,
    textAlign: 'center',
  },
});
