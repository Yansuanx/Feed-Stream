import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from 'react-native';
import { Sparkles, Lock, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Article } from '@/lib/types';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { fetchRecommendedArticles, fetchLatestArticles } from '@/lib/articles';

export function RecommendedSection() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        if (user) {
          const data = await fetchRecommendedArticles(user.id, 6);
          if (mounted) setArticles(data);
        } else {
          const data = await fetchLatestArticles(0, 6);
          if (mounted) setArticles(data);
        }
      } catch {
        if (mounted) setArticles([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user]);

  if (!loading && articles.length === 0) return null;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Sparkles size={16} color={colors.gold} strokeWidth={2} />
        <Text style={[s.title, { color: colors.textPrimary }]}>
          {user ? 'Recommended For You' : 'Editor\'s Picks'}
        </Text>
      </View>

      {loading ? (
        <View style={s.loadingRow}>
          <Text style={[s.loadingText, { color: colors.textTertiary }]}>Loading...</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
        >
          {articles.map((article) => (
            <Pressable
              key={article.id}
              onPress={() => router.push(`/article/${article.slug}`)}
              style={({ pressed }) => [
                s.card,
                { backgroundColor: colors.surface, borderColor: colors.border },
                pressed && { opacity: 0.85 },
              ]}
            >
              {article.image_url && (
                <Image source={{ uri: article.image_url }} style={s.cardImage} />
              )}
              <View style={s.cardBody}>
                {article.category && (
                  <Text style={[s.cardCategory, { color: colors.gold }]} numberOfLines={1}>
                    {article.category.name.toUpperCase()}
                  </Text>
                )}
                <Text
                  style={[s.cardTitle, { color: colors.textPrimary }]}
                  numberOfLines={2}
                >
                  {article.title}
                </Text>
                <View style={s.cardMeta}>
                  <Clock size={10} color={colors.textTertiary} strokeWidth={2} />
                  <Text style={[s.cardMetaText, { color: colors.textTertiary }]}>
                    {article.reading_time_min} min
                  </Text>
                  {article.is_premium && (
                    <Lock size={10} color={colors.gold} strokeWidth={2.5} />
                  )}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingTop: 24,
    paddingBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  title: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
  },
  loadingRow: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 110,
    resizeMode: 'cover',
  },
  cardBody: {
    padding: 12,
  },
  cardCategory: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    letterSpacing: 1,
    marginBottom: 6,
  },
  cardTitle: {
    fontFamily: 'PlayfairDisplay-SemiBold',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardMetaText: {
    fontFamily: 'Inter',
    fontSize: 10,
    marginLeft: 2,
  },
});
