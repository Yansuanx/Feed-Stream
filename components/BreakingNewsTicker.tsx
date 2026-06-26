import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Article } from '@/lib/types';
import { useTheme } from '@/lib/theme-context';
import { fetchBreakingNews } from '@/lib/articles';

export function BreakingNewsTicker() {
  const { colors } = useTheme();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    let mounted = true;
    const load = () => fetchBreakingNews().then((d) => { if (mounted) setArticles(d); }).catch(() => {});
    load();
    const refreshInterval = setInterval(load, 60000);
    return () => { mounted = false; clearInterval(refreshInterval); };
  }, []);

  // Auto-scroll the ticker
  useEffect(() => {
    if (articles.length === 0) return;
    const scrollInterval = setInterval(() => {
      offsetRef.current += 200;
      scrollRef.current?.scrollTo({ x: offsetRef.current, animated: true });
      // Reset when we've scrolled past content
      if (offsetRef.current > articles.length * 300) {
        offsetRef.current = 0;
        scrollRef.current?.scrollTo({ x: 0, animated: true });
      }
    }, 3000);
    return () => clearInterval(scrollInterval);
  }, [articles.length]);

  if (articles.length === 0) return null;

  return (
    <View style={[s.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <View style={[s.badge, { backgroundColor: colors.error }]}>
        <Zap size={11} color={colors.white} strokeWidth={2.5} />
        <Text style={s.badgeText}>BREAKING</Text>
      </View>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {articles.map((article, i) => (
          <Pressable
            key={article.id}
            onPress={() => router.push(`/article/${article.slug}`)}
            style={({ pressed }) => [s.item, pressed && { opacity: 0.7 }]}
          >
            <Text style={[s.itemText, { color: colors.textPrimary }]} numberOfLines={1}>
              {article.title}
            </Text>
            {i < articles.length - 1 && (
              <Text style={[s.separator, { color: colors.textTertiary }]}>·</Text>
            )}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 12,
    marginRight: 10,
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 20,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    maxWidth: 280,
  },
  separator: {
    fontSize: 13,
    marginHorizontal: 10,
  },
});
