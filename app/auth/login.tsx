import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await signIn(email.trim(), password);
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
        <Text style={[s.headline, { color: colors.textPrimary }]}>Welcome Back</Text>
        <Text style={[s.sub, { color: colors.textSecondary }]}>
          Sign in to continue reading premium content
        </Text>

        {error && (
          <View style={[s.errorBox, { backgroundColor: colors.error + '15' }]}>
            <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        <View style={s.form}>
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
              placeholder="Password"
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
            onPress={() => router.push('/auth/forgot')}
            hitSlop={8}
            style={s.forgotRow}
          >
            <Text style={[s.forgotText, { color: colors.gold }]}>Forgot password?</Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            style={({ pressed }) => [
              s.primaryBtn,
              { backgroundColor: colors.textPrimary },
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.6 },
            ]}
          >
            <Text style={[s.primaryBtnText, { color: colors.surface }]}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Text>
          </Pressable>

          <View style={s.dividerRow}>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <Text style={[s.dividerText, { color: colors.textTertiary }]}>OR</Text>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
          </View>

          <Pressable
            onPress={() => Alert.alert('Coming Soon', 'Google sign-in requires a native build.')}
            style={({ pressed }) => [
              s.socialBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={s.googleIcon}>G</Text>
            <Text style={[s.socialBtnText, { color: colors.textPrimary }]}>Continue with Google</Text>
          </Pressable>

          <Pressable
            onPress={() => Alert.alert('Coming Soon', 'Apple sign-in requires a native build.')}
            style={({ pressed }) => [
              s.socialBtn,
              { backgroundColor: colors.surface, borderColor: colors.border },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={s.appleIcon}></Text>
            <Text style={[s.socialBtnText, { color: colors.textPrimary }]}>Continue with Apple</Text>
          </Pressable>
        </View>

        <View style={s.footerRow}>
          <Text style={[s.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/auth/register')}>
            <Text style={[s.footerLink, { color: colors.gold }]}>Sign Up</Text>
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
  forgotRow: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
  },
  forgotText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 8,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  googleIcon: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#4285F4',
  },
  appleIcon: {
    fontSize: 18,
    color: '#000',
  },
  socialBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
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
