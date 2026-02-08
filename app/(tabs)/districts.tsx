import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";

const C = Colors.light;

const CATEGORY_COLORS: Record<string, string> = {
  "Ultra Premium": "#E8D5A3",
  Premium: C.tint,
  "Emerging Premium": "#7ED6DF",
  "Middle Market": "#74B9FF",
  Emerging: "#A29BFE",
};

function StatusBadge({ label }: { label: string }) {
  const { t } = useLanguage();
  const config: Record<string, { bg: string; text: string; display: string }> = {
    opportunity: { bg: C.green + "20", text: C.green, display: t('opportunity') },
    warning: { bg: C.orange + "20", text: C.orange, display: t('warning') },
    stable: { bg: "#8BA3C7" + "20", text: "#8BA3C7", display: t('stable') },
  };
  const c = config[label] || config.stable;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <View style={[styles.badgeDot, { backgroundColor: c.text }]} />
      <Text style={[styles.badgeText, { color: c.text }]}>{c.display}</Text>
    </View>
  );
}

function DistrictCard({ item, onPress }: { item: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardName}>{item.name}</Text>
          <StatusBadge label={item.statusLabel} />
        </View>
        <View style={[styles.categoryTag, { backgroundColor: (CATEGORY_COLORS[item.category] || C.tint) + "20" }]}>
          <Text style={[styles.categoryText, { color: CATEGORY_COLORS[item.category] || C.tint }]}>
            {item.category}
          </Text>
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          <Ionicons name="home-outline" size={13} color={C.textMuted} />
          <Text style={styles.cardMetaText}>{item.dominantTypology}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

export default function DistrictsScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const { t } = useLanguage();

  const FILTERS = [
    { key: "all", label: t('all') || "Tous" },
    { key: "opportunity", label: t('opportunity') },
    { key: "warning", label: t('warning') },
    { key: "stable", label: t('stable') },
  ];

  const { data: allDistricts, isLoading } = useQuery<any[]>({
    queryKey: ["/api/districts"],
  });

  const filtered = useMemo(() => {
    if (!allDistricts) return [];
    if (filter === "all") return allDistricts;
    return allDistricts.filter((d: any) => d.statusLabel === filter);
  }, [allDistricts, filter]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>{t('districts')}</Text>
        <Text style={styles.subtitle}>{allDistricts?.length || 0} {t('districts_analyzed')}</Text>
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, filter === f.key && styles.filterBtnActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={C.tint} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <DistrictCard
              item={item}
              onPress={() => router.push(`/district/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  title: {
    fontFamily: "DMSans_700Bold",
    fontSize: 24,
    color: C.white,
  },
  subtitle: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  filterBtnActive: {
    backgroundColor: C.tint + "20",
    borderColor: C.tint,
  },
  filterText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 12,
    color: C.textMuted,
  },
  filterTextActive: {
    color: C.tint,
  },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardHeader: { marginBottom: 8 },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: C.white,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 10,
    letterSpacing: 0.3,
  },
  categoryTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
  },
  cardDesc: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cardMetaText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.textMuted,
  },
});
