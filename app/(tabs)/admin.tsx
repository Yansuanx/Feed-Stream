import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  FlatList,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import {
  Plus,
  Edit3,
  Trash2,
  Eye,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
  X,
  FileText,
  LayoutDashboard,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme-context';
import { useAuth } from '@/lib/auth-context';
import { Article, Category } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { fetchCategories, fetchLatestArticles, trackEvent } from '@/lib/articles';
import { LoadingSpinner } from '@/components/Skeleton';

type Tab = 'dashboard' | 'articles' | 'categories';

export default function AdminScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalViews: 0,
    premiumCount: 0,
    subscriberCount: 0,
    trialStarts: 0,
    trialConversions: 0,
  });
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [arts, cats] = await Promise.all([
        fetchLatestArticles(0, 100),
        fetchCategories(),
      ]);
      setArticles(arts);
      setCategories(cats);

      // Calculate stats
      const totalViews = arts.reduce((sum, a) => sum + a.views, 0);
      const premiumCount = arts.filter((a) => a.is_premium).length;

      // Fetch subscriber count and analytics
      const [{ data: subscribers }, { data: trials }, { data: conversions }] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('is_premium', true),
        supabase.from('analytics_events').select('id', { count: 'exact' }).eq('event_type', 'trial_start'),
        supabase.from('analytics_events').select('id', { count: 'exact' }).eq('event_type', 'trial_started'),
      ]);

      setStats({
        totalArticles: arts.length,
        totalViews,
        premiumCount,
        subscriberCount: subscribers?.length ?? 0,
        trialStarts: trials?.length ?? 0,
        trialConversions: conversions?.length ?? 0,
      });
    } catch (e) {
      console.error('Admin load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteArticle = (article: Article) => {
    Alert.alert(
      'Delete Article',
      `Are you sure you want to delete "${article.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('articles').delete().eq('id', article.id);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              loadData();
            }
          },
        },
      ]
    );
  };

  const handleSaveArticle = async (data: Partial<Article>) => {
    const payload = {
      title: data.title,
      slug: data.slug || data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      summary: data.summary,
      content: data.content,
      image_url: data.image_url,
      category_id: data.category_id,
      author: data.author || 'FeedStream Staff',
      reading_time_min: data.reading_time_min || 5,
      is_premium: data.is_premium ?? false,
      is_featured: data.is_featured ?? false,
      is_breaking: data.is_breaking ?? false,
    };

    if (editingArticle) {
      const { error } = await supabase.from('articles').update(payload).eq('id', editingArticle.id);
      if (error) Alert.alert('Error', error.message);
    } else {
      const { error } = await supabase.from('articles').insert(payload);
      if (error) Alert.alert('Error', error.message);
    }
    setShowEditor(false);
    setEditingArticle(null);
    loadData();
  };

  if (!user || !profile?.is_admin) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[s.title, { color: colors.textPrimary }]}>Admin</Text>
        </View>
        <View style={s.accessDenied}>
          <LayoutDashboard size={48} color={colors.textTertiary} strokeWidth={1.5} />
          <Text style={[s.deniedTitle, { color: colors.textPrimary }]}>Access Restricted</Text>
          <Text style={[s.deniedSub, { color: colors.textSecondary }]}>
            You need admin privileges to access this dashboard
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { backgroundColor: colors.background }]}>
      <View style={[s.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[s.title, { color: colors.textPrimary }]}>Admin Dashboard</Text>
        <Pressable
          onPress={() => { setEditingArticle(null); setShowEditor(true); }}
          style={({ pressed }) => [
            s.addBtn,
            { backgroundColor: colors.gold },
            pressed && { opacity: 0.85 },
          ]}
        >
          <Plus size={18} color="#000" strokeWidth={2.5} />
          <Text style={s.addBtnText}>New</Text>
        </Pressable>
      </View>

      {/* Tab Bar */}
      <View style={[s.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {([
          { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { key: 'articles', label: 'Articles', icon: FileText },
          { key: 'categories', label: 'Categories', icon: LayoutDashboard },
        ] as const).map(({ key, label, icon: Icon }) => (
          <Pressable
            key={key}
            onPress={() => setTab(key)}
            style={[
              s.tab,
              tab === key && { borderBottomColor: colors.gold, borderBottomWidth: 2 },
            ]}
          >
            <Icon size={16} color={tab === key ? colors.gold : colors.textSecondary} strokeWidth={2} />
            <Text
              style={[
                s.tabText,
                { color: tab === key ? colors.textPrimary : colors.textSecondary },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <LoadingSpinner />
        </View>
      ) : tab === 'dashboard' ? (
        <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Stats Grid */}
          <View style={s.statsGrid}>
            <StatCard
              icon={FileText}
              label="Total Articles"
              value={stats.totalArticles}
              colors={colors}
            />
            <StatCard
              icon={Eye}
              label="Total Views"
              value={stats.totalViews}
              colors={colors}
            />
            <StatCard
              icon={Users}
              label="Subscribers"
              value={stats.subscriberCount}
              colors={colors}
            />
            <StatCard
              icon={TrendingUp}
              label="Premium Articles"
              value={stats.premiumCount}
              colors={colors}
            />
            <StatCard
              icon={DollarSign}
              label="Trial Starts"
              value={stats.trialStarts}
              colors={colors}
            />
            <StatCard
              icon={BarChart3}
              label="Conversions"
              value={stats.trialConversions}
              colors={colors}
            />
          </View>

          {/* Conversion Rate */}
          <View style={[s.conversionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.conversionTitle, { color: colors.textPrimary }]}>
              Trial Conversion Rate
            </Text>
            <Text style={[s.conversionValue, { color: colors.gold }]}>
              {stats.trialStarts > 0
                ? Math.round((stats.trialConversions / stats.trialStarts) * 100)
                : 0}%
            </Text>
            <Text style={[s.conversionSub, { color: colors.textSecondary }]}>
              {stats.trialConversions} of {stats.trialStarts} trials converted
            </Text>
          </View>

          {/* Top Articles */}
          <Text style={[s.sectionLabel, { color: colors.textTertiary }]}>TOP ARTICLES BY VIEWS</Text>
          <View style={[s.listCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {articles
              .sort((a, b) => b.views - a.views)
              .slice(0, 5)
              .map((article, i) => (
                <View key={article.id} style={[s.topArticleRow, i > 0 && { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <Text style={[s.rankText, { color: colors.gold }]}>{i + 1}</Text>
                  <View style={s.topArticleInfo}>
                    <Text style={[s.topArticleTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                      {article.title}
                    </Text>
                    <Text style={[s.topArticleMeta, { color: colors.textTertiary }]}>
                      {article.views} views · {article.reading_time_min} min
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </ScrollView>
      ) : tab === 'articles' ? (
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[s.articleRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={s.articleInfo}>
                <Text style={[s.articleTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={s.articleMetaRow}>
                  {item.category && (
                    <Text style={[s.articleCategory, { color: colors.gold }]}>
                      {item.category.name.toUpperCase()}
                    </Text>
                  )}
                  <Text style={[s.articleMeta, { color: colors.textTertiary }]}>
                    {item.views} views
                  </Text>
                  {item.is_premium && (
                    <View style={[s.badge, { backgroundColor: colors.gold + '20' }]}>
                      <Text style={[s.badgeText, { color: colors.gold }]}>PREMIUM</Text>
                    </View>
                  )}
                  {item.is_featured && (
                    <View style={[s.badge, { backgroundColor: colors.textPrimary }]}>
                      <Text style={[s.badgeText, { color: colors.surface }]}>FEATURED</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={s.articleActions}>
                <Pressable
                  onPress={() => { setEditingArticle(item); setShowEditor(true); }}
                  hitSlop={8}
                >
                  <Edit3 size={18} color={colors.textSecondary} strokeWidth={2} />
                </Pressable>
                <Pressable
                  onPress={() => handleDeleteArticle(item)}
                  hitSlop={8}
                >
                  <Trash2 size={18} color={colors.error} strokeWidth={2} />
                </Pressable>
              </View>
            </View>
          )}
          contentContainerStyle={s.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <CategoryManager categories={categories} colors={colors} onRefresh={loadData} />
      )}

      {/* Article Editor Modal */}
      <Modal visible={showEditor} animationType="slide" onRequestClose={() => setShowEditor(false)}>
        <ArticleEditor
          article={editingArticle}
          categories={categories}
          colors={colors}
          onClose={() => { setShowEditor(false); setEditingArticle(null); }}
          onSave={handleSaveArticle}
        />
      </Modal>
    </View>
  );
}

function StatCard({ icon: Icon, label, value, colors }: {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  value: number;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[s.statIcon, { backgroundColor: colors.gold + '15' }]}>
        <Icon size={18} color={colors.gold} strokeWidth={2} />
      </View>
      <Text style={[s.statValue, { color: colors.textPrimary }]}>{value.toLocaleString()}</Text>
      <Text style={[s.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function CategoryManager({ categories, colors, onRefresh }: {
  categories: Category[];
  colors: ReturnType<typeof useTheme>['colors'];
  onRefresh: () => void;
}) {
  const [newName, setNewName] = useState('');

  const addCategory = async () => {
    if (!newName.trim()) return;
    const slug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { error } = await supabase.from('categories').insert({ name: newName.trim(), slug });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setNewName('');
      onRefresh();
    }
  };

  const deleteCategory = async (cat: Category) => {
    Alert.alert('Delete Category', `Delete "${cat.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('categories').delete().eq('id', cat.id);
          if (error) Alert.alert('Error', error.message);
          else onRefresh();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={[s.addCategoryRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TextInput
          value={newName}
          onChangeText={setNewName}
          placeholder="New category name"
          placeholderTextColor={colors.textTertiary}
          style={[s.categoryInput, { color: colors.textPrimary }]}
        />
        <Pressable
          onPress={addCategory}
          style={({ pressed }) => [s.addCatBtn, { backgroundColor: colors.gold }, pressed && { opacity: 0.85 }]}
        >
          <Plus size={18} color="#000" strokeWidth={2.5} />
        </Pressable>
      </View>

      {categories.map((cat) => (
        <View key={cat.id} style={[s.catRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.catName, { color: colors.textPrimary }]}>{cat.name}</Text>
          <Pressable onPress={() => deleteCategory(cat)} hitSlop={8}>
            <Trash2 size={18} color={colors.error} strokeWidth={2} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

function ArticleEditor({ article, categories, colors, onClose, onSave }: {
  article: Article | null;
  categories: Category[];
  colors: ReturnType<typeof useTheme>['colors'];
  onClose: () => void;
  onSave: (data: Partial<Article>) => void;
}) {
  const [title, setTitle] = useState(article?.title ?? '');
  const [summary, setSummary] = useState(article?.summary ?? '');
  const [content, setContent] = useState(article?.content ?? '');
  const [imageUrl, setImageUrl] = useState(article?.image_url ?? '');
  const [categoryId, setCategoryId] = useState(article?.category_id ?? categories[0]?.id ?? '');
  const [author, setAuthor] = useState(article?.author ?? '');
  const [readingTime, setReadingTime] = useState(String(article?.reading_time_min ?? 5));
  const [isPremium, setIsPremium] = useState(article?.is_premium ?? false);
  const [isFeatured, setIsFeatured] = useState(article?.is_featured ?? false);
  const [isBreaking, setIsBreaking] = useState(article?.is_breaking ?? false);

  const handleSave = () => {
    if (!title.trim() || !summary.trim() || !content.trim()) {
      Alert.alert('Missing Fields', 'Title, summary, and content are required');
      return;
    }
    onSave({
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      image_url: imageUrl.trim() || null,
      category_id: categoryId || null,
      author: author.trim() || 'FeedStream Staff',
      reading_time_min: parseInt(readingTime) || 5,
      is_premium: isPremium,
      is_featured: isFeatured,
      is_breaking: isBreaking,
    });
  };

  return (
    <View style={[s.editorContainer, { backgroundColor: colors.background }]}>
      <View style={[s.editorHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable onPress={onClose} hitSlop={8}>
          <X size={22} color={colors.textPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={[s.editorTitle, { color: colors.textPrimary }]}>
          {article ? 'Edit Article' : 'New Article'}
        </Text>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [s.saveBtn, { backgroundColor: colors.gold }, pressed && { opacity: 0.85 }]}
        >
          <Text style={s.saveBtnText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={s.editorScroll} showsVerticalScrollIndicator={false}>
        <EditorField label="Title" colors={colors}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Article title"
            placeholderTextColor={colors.textTertiary}
            style={[s.editorInput, { color: colors.textPrimary, borderColor: colors.border }]}
          />
        </EditorField>

        <EditorField label="Author" colors={colors}>
          <TextInput
            value={author}
            onChangeText={setAuthor}
            placeholder="Author name"
            placeholderTextColor={colors.textTertiary}
            style={[s.editorInput, { color: colors.textPrimary, borderColor: colors.border }]}
          />
        </EditorField>

        <EditorField label="Image URL" colors={colors}>
          <TextInput
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textTertiary}
            style={[s.editorInput, { color: colors.textPrimary, borderColor: colors.border }]}
            autoCapitalize="none"
          />
        </EditorField>

        <EditorField label="Category" colors={colors}>
          <View style={[s.categoryPicker, { borderColor: colors.border }]}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryId(cat.id)}
                style={[
                  s.catPill,
                  categoryId === cat.id && { backgroundColor: colors.gold },
                ]}
              >
                <Text
                  style={[
                    s.catPillText,
                    { color: categoryId === cat.id ? '#000' : colors.textSecondary },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </EditorField>

        <EditorField label="Reading Time (min)" colors={colors}>
          <TextInput
            value={readingTime}
            onChangeText={setReadingTime}
            placeholder="5"
            placeholderTextColor={colors.textTertiary}
            style={[s.editorInput, { color: colors.textPrimary, borderColor: colors.border }]}
            keyboardType="numeric"
          />
        </EditorField>

        <EditorField label="Summary" colors={colors}>
          <TextInput
            value={summary}
            onChangeText={setSummary}
            placeholder="Brief summary..."
            placeholderTextColor={colors.textTertiary}
            style={[s.editorTextArea, { color: colors.textPrimary, borderColor: colors.border }]}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </EditorField>

        <EditorField label="Content" colors={colors}>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Full article content (use double line breaks for paragraphs)..."
            placeholderTextColor={colors.textTertiary}
            style={[s.editorTextArea, s.editorContentArea, { color: colors.textPrimary, borderColor: colors.border }]}
            multiline
            numberOfLines={10}
            textAlignVertical="top"
          />
        </EditorField>

        {/* Toggles */}
        <View style={[s.togglesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <ToggleRow label="Premium" value={isPremium} onToggle={() => setIsPremium(!isPremium)} colors={colors} />
          <ToggleRow label="Featured" value={isFeatured} onToggle={() => setIsFeatured(!isFeatured)} colors={colors} />
          <ToggleRow label="Breaking" value={isBreaking} onToggle={() => setIsBreaking(!isBreaking)} colors={colors} />
        </View>
      </ScrollView>
    </View>
  );
}

function EditorField({ label, children, colors }: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={s.editorField}>
      <Text style={[s.editorLabel, { color: colors.textTertiary }]}>{label.toUpperCase()}</Text>
      {children}
    </View>
  );
}

function ToggleRow({ label, value, onToggle, colors }: {
  label: string;
  value: boolean;
  onToggle: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={s.toggleRow}>
      <Text style={[s.toggleLabel, { color: colors.textPrimary }]}>{label}</Text>
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
    fontSize: 22,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  addBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#000',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  tabText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    width: '47%',
    flexGrow: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
  conversionCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 28,
  },
  conversionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  conversionValue: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 40,
    marginBottom: 4,
  },
  conversionSub: {
    fontFamily: 'Inter',
    fontSize: 13,
  },
  sectionLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 12,
  },
  listCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  topArticleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  rankText: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 20,
    width: 24,
  },
  topArticleInfo: {
    flex: 1,
  },
  topArticleTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginBottom: 4,
  },
  topArticleMeta: {
    fontFamily: 'Inter',
    fontSize: 12,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  articleInfo: {
    flex: 1,
  },
  articleTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  articleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  articleCategory: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  articleMeta: {
    fontFamily: 'Inter',
    fontSize: 11,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 9,
    letterSpacing: 0.5,
  },
  articleActions: {
    flexDirection: 'row',
    gap: 16,
    marginLeft: 12,
  },
  accessDenied: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  deniedTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 22,
    marginTop: 16,
    marginBottom: 8,
  },
  deniedSub: {
    fontFamily: 'Inter',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  // Editor
  editorContainer: {
    flex: 1,
  },
  editorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'web' ? 16 : 56,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  editorTitle: {
    fontFamily: 'PlayfairDisplay-Bold',
    fontSize: 18,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  saveBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#000',
  },
  editorScroll: {
    padding: 20,
    paddingBottom: 60,
  },
  editorField: {
    marginBottom: 20,
  },
  editorLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
  },
  editorInput: {
    fontFamily: 'Inter',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  editorTextArea: {
    fontFamily: 'Inter',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 80,
  },
  editorContentArea: {
    minHeight: 200,
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  catPillText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  togglesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
  // Categories
  addCategoryRow: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  categoryInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 15,
    paddingHorizontal: 8,
  },
  addCatBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  catRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  catName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
  },
});
