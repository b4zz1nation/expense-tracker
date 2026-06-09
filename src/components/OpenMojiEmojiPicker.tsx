import { Search, X } from 'lucide-react-native';
import { memo, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { OPENMOJI_EMOJIS, type OpenMojiEmoji } from '../data/openMojiEmoji';
import { useAppTheme } from '../theme/ThemeContext';

type Props = {
  visible: boolean;
  selectedEmoji?: string;
  title?: string;
  onClose: () => void;
  onSelect: (emoji: string) => void;
};

const EmojiCell = memo(function EmojiCell({ item, selected, onPress }: { item: OpenMojiEmoji; selected: boolean; onPress: () => void }) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.name || item.hexcode}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.emojiCell, selected && styles.emojiCellSelected, pressed && styles.pressed]}
    >
      <Text style={styles.emojiGlyph}>{item.emoji}</Text>
    </Pressable>
  );
});

export function OpenMojiEmojiPicker({ visible, selectedEmoji, title = 'Choose emoji', onClose, onSelect }: Props) {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors } = theme;
  const [query, setQuery] = useState('');

  const filteredEmojis = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return OPENMOJI_EMOJIS;
    return OPENMOJI_EMOJIS.filter((item) => {
      return item.emoji === normalized || item.name.toLowerCase().includes(normalized) || item.group.toLowerCase().includes(normalized) || item.tags.toLowerCase().includes(normalized) || item.hexcode.toLowerCase().includes(normalized);
    });
  }, [query]);

  const selectEmoji = (emoji: string) => {
    onSelect(emoji);
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>OpenMoji set · {filteredEmojis.length} emojis</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close emoji picker" onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
              <X color={colors.textMuted} size={20} strokeWidth={2.6} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Search color={colors.textMuted} size={18} strokeWidth={2.5} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search OpenMoji"
              placeholderTextColor={colors.textMuted}
              selectionColor={colors.primary}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>

          <FlatList
            data={filteredEmojis}
            keyExtractor={(item) => item.hexcode}
            numColumns={8}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            initialNumToRender={80}
            maxToRenderPerBatch={96}
            windowSize={9}
            removeClippedSubviews
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => (
              <EmojiCell item={item} selected={selectedEmoji === item.emoji} onPress={() => selectEmoji(item.emoji)} />
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  const { colors, spacing } = theme;
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    sheet: { backgroundColor: colors.sheet, borderTopLeftRadius: 26, borderTopRightRadius: 26, gap: 12, maxHeight: '84%', paddingBottom: spacing.lg, paddingHorizontal: spacing.screen, paddingTop: 10 },
    handle: { alignSelf: 'center', backgroundColor: colors.divider, borderRadius: 999, height: 4, marginBottom: 2, width: 42 },
    header: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
    headerText: { flex: 1, gap: 2 },
    title: { color: colors.text, fontSize: 21, fontWeight: '900' },
    subtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700' },
    closeButton: { alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: 999, height: 36, justifyContent: 'center', width: 36 },
    searchBox: { alignItems: 'center', backgroundColor: colors.input, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 12 },
    searchInput: { color: colors.text, flex: 1, minHeight: 44 },
    grid: { gap: 8, paddingBottom: 10 },
    emojiCell: { alignItems: 'center', aspectRatio: 1, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flex: 1, justifyContent: 'center', margin: 3, maxWidth: `${100 / 8}%` },
    emojiCellSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoftBorder },
    emojiGlyph: { fontSize: 24, lineHeight: 30 },
    pressed: { opacity: 0.78 },
  });
}
