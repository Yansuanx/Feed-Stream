import { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, DimensionValue, ViewStyle } from 'react-native';
import { useTheme } from '@/lib/theme-context';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, radius = 8, style }: SkeletonProps) {
  const { colors } = useTheme();
  const [opacity, setOpacity] = useState(0.3);

  useEffect(() => {
    let mounted = true;
    const interval = setInterval(() => {
      if (mounted) setOpacity((o) => (o === 0.3 ? 0.6 : 0.3));
    }, 800);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: colors.surfaceElevated,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ArticleCardSkeleton() {
  return (
    <View style={s.card}>
      <Skeleton width={80} height={80} radius={12} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Skeleton width={60} height={12} style={{ marginBottom: 8 }} />
        <Skeleton height={16} style={{ marginBottom: 6 }} />
        <Skeleton width="80%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width={100} height={12} />
      </View>
    </View>
  );
}

export function HeroSkeleton() {
  return (
    <View style={s.hero}>
      <Skeleton width="100%" height={220} radius={16} style={{ marginBottom: 16 }} />
      <Skeleton width={80} height={14} style={{ marginBottom: 10 }} />
      <Skeleton height={24} style={{ marginBottom: 8 }} />
      <Skeleton width="90%" height={24} style={{ marginBottom: 12 }} />
      <Skeleton height={14} style={{ marginBottom: 6 }} />
      <Skeleton width="70%" height={14} />
    </View>
  );
}

export function LoadingSpinner({ size = 'large' }: { size?: 'small' | 'large' }) {
  const { colors } = useTheme();
  return <ActivityIndicator size={size} color={colors.gold} />;
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  hero: {
    padding: 0,
  },
});
