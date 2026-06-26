import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Platform } from 'react-native';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setError(null);
    const { error } = await resetPassword(email.trim());
    if (error) {
      setError(error);
    } else {
      setSent(true);
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

        {sent ? (
          <View style={s.successContainer}>
            <View style={[s.successIcon, { backgroundColor: colors.gold + '20' }]}>
              <CheckCircle size={40} color={colors.gold} strokeWidth={2} />
            </View>
            <Text style={[s.headline, { color: colors.textPrimary }]}>Check Your Email</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              We've sent a password reset link to{'\n'}{email}
            </Text>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                s.primaryBtn,
                { backgroundColor: colors.textPrimary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[s.primaryBtnText, { color: colors.surface }]}>Back to Sign In</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={[s.headline, { color: colors.textPrimary }]}>Reset Password</Text>
            <Text style={[s.sub, { color: colors.textSecondary }]}>
              Enter your email and we'll send you a link to reset your password
            </Text>

            {error && (
              <View style={[s.errorBox, { backgroundColor: colors.error + '15' }]}>
                <Text style={[s.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

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

            <Pressable
              onPress={handleReset}
              disabled={loading}
              style={({ pressed }) => [
                s.primaryBtn,
                { backgroundColor: colors.textPrimary },
                pressed && { opacity: 0.85 },
                loading && { opacity: 0.6 },
              ]}
            >
              <Text style={[s.primaryBtnText, { color: colors.surface }]}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </Pressable>
          </>
        )}
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
    lineHeight: 22,
  },
  successContainer: {
    alignItems: 'center',
    paddingTop: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
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
  },
  primaryBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
});
