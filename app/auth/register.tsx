import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';

export default function RegisterScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await signUp(email.trim(), password, fullName.trim());
    if (error) {
      setError(error);
    } else {
      router.back();
    }
    setLoading(false);
  };

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={s.body}>
        <Text style={[s.logo, { color: colors.textPrimary }]}>
          Feed{' '}
          <Text style={{ color: colors.gold }}>Stream</Text>
        </Text>
        <Text style={[s.headline, { color: colors.textPrimary }]}>Create Account</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>
          Join 500,000+ readers staying ahead of the market
        </Text>

        {error && (
          <View style={[s.errorBox, { backgroundColor: colors.error + '15' }]}>
            <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={s.form}>
          <View style={[s.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <User size={18} color={colors.textTertiary} strokeWidth={2} />
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={colors.textTertiary}
              style={[s.input, { color: colors.textPrimary }]}
              autoCapitalize="words"
            />
          </View>

          <View style={[s.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Mail size={18} color={colors.textTertiary} strokeWidth={2} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={colors.textTertiary}
              style={[s.input, { color: colors.textPrimary }]}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={[s.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Lock size={18} color={colors.textTertiary} strokeWidth={2} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 6 characters)"
              placeholderTextColor={colors.textTertiary}
              style={[s.input, { color: colors.textPrimary }]}
              secureTextEntry={!showPassword}
            />
            <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              {showPassword ? (
                <EyeOff size={18} color={colors.textTertiary} strokeWidth={2} />
              ) : (
                <Eye size={18} color={colors.textTertiary} strokeWidth={2} />
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={handleRegister}
            disabled={loading}
            style={({ pressed }) => [
              s.primaryBtn,
              { backgroundColor: colors.textPrimary },
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.6 },
            ]}
          >
            <Text style={[s.primaryBtnText, { color: colors.surface }]}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Text>
          </Pressable>
        </View>

        <View style={s.footerRow}>
          <Text style={[s.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/auth/login')}>
            <Text style={[s.footerLink, { color: colors.gold }]}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  logo: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    marginBottom: 24,
  },
  headline: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 28,
    marginBottom: 8,
  },
  sub: {
    fontFamily: 'Inter',
    fontSize: 15,
    marginBottom: 28,
  },
  errorBox: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 14,
  },
  form: {
    gap: 14,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 15,
    padding: 0,
  },
  primaryBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
    marginBottom: 24,
  },
  footerText: {
    fontFamily: 'Inter',
    fontSize: 14,
  },
  footerLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
});
