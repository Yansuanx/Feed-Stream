import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Platform,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Search, X, TrendingUp, Clock, SlidersHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { Article, Category } from '@/lib/types';
import { searchArticles, fetchLatestArticles, fetchCategories, fetchAuthors } from '@/lib/articles';
import { ArticleCard } from '@/components/ArticleCard';

const RECENT_KEY = 'recent_searches';

export default function SearchScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [trending, setTrending] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchLatestArticles(0, 5).then(setTrending).catch(console.error);
    fetchCategories().then(setCategories).catch(console.error);
    fetchAuthors().then(setAuthors).catch(console.error);
    // Load recent searches from localStorage
    try {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(RECENT_KEY) : null;
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {}
  }, []);

  const saveRecentSearch = (q: string) => {
    try {
      if (typeof localStorage === 'undefined') return;
      const updated = [q, ...recentSearches.filter((s) => s !== q)].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const performSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    saveRecentSearch(q.trim());
    try {
      const data = await searchArticles(q.trim(), selectedCategory, selectedAuthor);
      setResults(data);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedAuthor]);

  const onQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(text), 200);
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const selectRecent = (q: string) => {
    setQuery(q);
    performSearch(q);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(RECENT_KEY);
    } catch {}
  };

  const toggleCategory = (catId: string) => {
    const newCat = selectedCategory === catId ? null : catId;
    setSelectedCategory(newCat);
    if (query.trim().length >= 2) {
      setTimeout(() => searchArticles(query.trim(), newCat, selectedAuthor).then(setResults), 0);
    }
  };

  const toggleAuthor = (author: string) => {
    const newAuthor = selectedAuthor === author ? null : author;
    setSelectedAuthor(newAuthor);
    if (query.trim().length >= 2) {
      setTimeout(() => searchArticles(query.trim(), selectedCategory, newAuthor).then(setResults), 0);
    }
  };

  const hasFilters = selectedCategory || selectedAuthor;

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      {/* Search Bar */}
      <View style={[s.searchHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[s.searchInputWrap, { backgroundColor: colors.surfaceElevated }]}>
          <Search size={18} color={colors.textTertiary} strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={onQueryChange}
            placeholder="Search articles, authors, topics..."
            placeholderTextColor={colors.textTertiary}
            style={[s.searchInput, { color: colors.textPrimary }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={clearQuery} hitSlop={8}>
              <X size={18} color={colors.textTertiary} strokeWidth={2} />
            </Pressable>
          )}
          <Pressable onPress={() => setShowFilters(!showFilters)} hitSlop={8}>
            <SlidersHorizontal
              size={18}
              color={hasFilters ? colors.gold : colors.textTertiary}
              strokeWidth={2}
            />
          </Pressable>
        </View>

        {/* Filter Panel */}
        {showFilters && (
          <View style={s.filterPanel}>
            <Text style={[s.filterLabel, { color: colors.textTertiary }]}>CATEGORIES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  style={[
                    s.filterPill,
                    {
                      backgroundColor: selectedCategory === cat.id ? colors.gold : colors.surfaceElevated,
                      borderColor: selectedCategory === cat.id ? colors.gold : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.filterPillText,
                      { color: selectedCategory === cat.id ? '#000' : colors.textSecondary },
                    ]}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {authors.length > 0 && (
              <>
                <Text style={[s.filterLabel, { color: colors.textTertiary, marginTop: 12 }]}>AUTHORS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterScroll}>
                  {authors.slice(0, 10).map((author) => (
                    <Pressable
                      key={author}
                      onPress={() => toggleAuthor(author)}
                      style={[
                        s.filterPill,
                        {
                          backgroundColor: selectedAuthor === author ? colors.gold : colors.surfaceElevated,
                          borderColor: selectedAuthor === author ? colors.gold : colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          s.filterPillText,
                          { color: selectedAuthor === author ? '#000' : colors.textSecondary },
                        ]}
                      >
                        {author}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </View>
        )}
      </View>

      <FlatList
        data={searched ? results : trending}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ArticleCard article={item} />}
        ListHeaderComponent={
          !searched ? (
            <View style={s.listHeader}>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={s.recentSection}>
                  <View style={s.recentHeader}>
                    <Clock size={14} color={colors.textTertiary} strokeWidth={2} />
                    <Text style={[s.recentTitle, { color: colors.textSecondary }]}>Recent</Text>
                    <Pressable onPress={clearRecent} hitSlop={8} style={{ marginLeft: 'auto' }}>
                      <Text style={[s.clearText, { color: colors.gold }]}>Clear</Text>
                    </Pressable>
                  </View>
                  <View style={s.recentChips}>
                    {recentSearches.map((q) => (
                      <Pressable
                        key={q}
                        onPress={() => selectRecent(q)}
                        style={({ pressed }) => [
                          s.recentChip,
                          { backgroundColor: colors.surfaceElevated, borderColor: colors.border },
                          pressed && { opacity: 0.7 },
                        ]}
                      >
                        <Text style={[s.recentChipText, { color: colors.textPrimary }]}>{q}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {/* Trending */}
              <View style={s.trendingHeader}>
                <TrendingUp size={16} color={colors.gold} strokeWidth={2} />
                <Text style={[s.sectionTitle, { color: colors.textPrimary }]}>
                  Trending Now
                </Text>
              </View>
            </View>
          ) : (
            searched && results.length > 0 ? (
              <View style={s.resultsHeader}>
                <Text style={[s.resultsCount, { color: colors.textSecondary }]}>
                  {results.length} {results.length === 1 ? 'result' : 'results'} for "{query}"
                </Text>
              </View>
            ) : null
          )
        }
        ListEmptyComponent={
          loading ? (
            <View style={s.loadingWrap}>
              <ActivityIndicator size="large" color={colors.gold} />
            </View>
          ) : searched ? (
            <View style={s.emptyResults}>
              <Search size={40} color={colors.textTertiary} strokeWidth={1.5} />
              <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>
                No results found
              </Text>
              <Text style={[s.emptySub, { color: colors.textSecondary }]}>
                Try different keywords or check spelling
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchHeader: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 15,
    padding: 0,
  },
  filterPanel: {
    paddingTop: 14,
  },
  filterLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 8,
  },
  filterScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  filterPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  listHeader: {
    paddingTop: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  recentSection: {
    marginBottom: 24,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  recentTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  clearText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  recentChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  recentChipText: {
    fontFamily: 'Inter',
    fontSize: 13,
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
  },
  resultsHeader: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  resultsCount: {
    fontFamily: 'Inter',
    fontSize: 14,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyResults: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: 'Inter',
    fontSize: 14,
  },
});
