import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  Pressable,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { ArrowLeft, Bell, TrendingUp, FileText, Zap, Moon } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { NotificationPreferences } from '@/lib/types';
import { fetchNotificationPreferences, upsertNotificationPreferences } from '@/lib/articles';

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPrefs = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const data = await fetchNotificationPreferences(user.id);
      if (data) {
        setPrefs(data);
      } else {
        // Create default prefs
        const defaults: NotificationPreferences = {
          id: '',
          user_id: user.id,
          breaking_news: true,
          market_alerts: true,
          daily_digest: true,
          trending_stories: false,
          quiet_hours_start: '22:00',
          quiet_hours_end: '07:00',
        };
        setPrefs(defaults);
      }
    } catch (e) {
      console.error('Notif prefs error:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPrefs();
  }, [loadPrefs]);

  const updatePref = async (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!user || !prefs) return;
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    try {
      await upsertNotificationPreferences(user.id, { [key]: value });
    } catch (e) {
      console.error('Update pref error:', e);
    }
  };

  if (!user) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
          </Pressable>
          <Text style={[s.title, { color: colors.textPrimary }]}>Notifications</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={s.emptyState}>
          <Bell size={48} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
            Sign in to manage notifications
          </Text>
          <Pressable
            onPress={() => router.push('/auth/login')}
            style={({ pressed }) => [s.signInBtn, { backgroundColor: colors.textPrimary }, pressed && { opacity: 0.85 }]}
          >
            <Text style={[s.signInBtnText, { color: colors.surface }]}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[s.title, { color: colors.textPrimary }]}>Notifications</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>ALERT TYPES</Text>
        <View style={[s.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <NotifRow
            icon={Zap}
            label="Breaking News"
            description="Urgent news alerts as they happen"
            value={prefs?.breaking_news ?? true}
            onToggle={(v) => updatePref('breaking_news', v)}
            colors={colors}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <NotifRow
            icon={TrendingUp}
            label="Market Alerts"
            description="Significant market movements"
            value={prefs?.market_alerts ?? true}
            onToggle={(v) => updatePref('market_alerts', v)}
            colors={colors}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <NotifRow
            icon={FileText}
            label="Daily Digest"
            description="Morning briefing with top stories"
            value={prefs?.daily_digest ?? true}
            onToggle={(v) => updatePref('daily_digest', v)}
            colors={colors}
          />
          <View style={[s.divider, { backgroundColor: colors.border }]} />
          <NotifRow
            icon={TrendingUp}
            label="Trending Stories"
            description="Most read articles of the day"
            value={prefs?.trending_stories ?? false}
            onToggle={(v) => updatePref('trending_stories', v)}
            colors={colors}
          />
        </View>

        <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>QUIET HOURS</Text>
        <View style={[s.settingsGroup, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.quietHoursRow}>
            <View style={s.quietHoursLeft}>
              <Moon size={20} color={colors.textSecondary} strokeWidth={2} />
              <View>
                <Text style={[s.settingText, { color: colors.textPrimary }]}>Quiet Hours</Text>
                <Text style={[s.settingSub, { color: colors.textTertiary }]}>
                  {prefs?.quiet_hours_start ?? '22:00'} — {prefs?.quiet_hours_end ?? '07:00'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <Text style={[s.note, { color: colors.textTertiary }]}>
          During quiet hours, all non-breaking notifications are silenced.
        </Text>
      </ScrollView>
    </View>
  );
}

function NotifRow({
  icon: Icon,
  label,
  description,
  value,
  onToggle,
  colors,
}: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={s.notifRow}>
      <View style={s.notifLeft}>
        <Icon size={20} color={colors.textSecondary} strokeWidth={2} />
        <View>
          <Text style={[s.settingText, { color: colors.textPrimary }]}>{label}</Text>
          <Text style={[s.settingSub, { color: colors.textTertiary }]}>{description}</Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.gold }}
        thumbColor={value ? '#000' : colors.surface}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
  notifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  notifLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  settingText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    marginBottom: 2,
  },
  settingSub: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 50,
  },
  quietHoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  quietHoursLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  note: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  signInBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 999,
  },
  signInBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
});
