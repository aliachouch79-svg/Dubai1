import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";

const C = Colors.light;

interface GlobalStats {
  year: number;
  avgPricePerSqm: number;
  avgYield: number;
  avgGrowth: number;
  totalTransactions: number;
  totalValueBillions: number;
  districtCount: number;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

function KPICard({
  icon,
  iconSet,
  label,
  value,
  suffix,
  color,
}: {
  icon: string;
  iconSet?: "ion" | "mci";
  label: string;
  value: string;
  suffix?: string;
  color?: string;
}) {
  const iconColor = color || C.tint;
  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIconWrap, { backgroundColor: iconColor + "18" }]}>
        {iconSet === "mci" ? (
          <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
        ) : (
          <Ionicons name={icon as any} size={20} color={iconColor} />
        )}
      </View>
      <Text style={styles.kpiValue}>
        {value}
        {suffix ? <Text style={styles.kpiSuffix}>{suffix}</Text> : null}
      </Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { t, language, setLanguage } = useLanguage();

  const { data: stats, isLoading, refetch } = useQuery<GlobalStats>({
    queryKey: ["/api/stats/global"],
  });

  const { data: districts } = useQuery<any[]>({
    queryKey: ["/api/districts"],
  });

  const { data: opportunities } = useQuery<any[]>({
    queryKey: ["/api/opportunities"],
  });

  const topOpportunities = (opportunities || []).slice(0, 3);
  const greenZones = (districts || []).filter((d: any) => d.statusLabel === "opportunity").length;
  const warningZones = (districts || []).filter((d: any) => d.statusLabel === "warning").length;

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad }]}>
        <ActivityIndicator size="large" color={C.tint} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 16, paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} tintColor={C.tint} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Dubai Invest</Text>
            <Text style={styles.headerSub}>{t('market_intelligence')} {stats?.year || 2025}</Text>
          </View>
          <View style={styles.langSelector}>
            {(['fr', 'en', 'ar'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                onPress={() => setLanguage(lang)}
                style={[
                  styles.langBtn,
                  language === lang && styles.langBtnActive
                ]}
              >
                <Text style={[
                  styles.langText,
                  language === lang && styles.langTextActive
                ]}>
                  {lang.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <KPICard
            icon="trending-up"
            label={t('yield')}
            value={stats ? stats.avgYield.toFixed(1) : "No data"}
            suffix="%"
            color={C.green}
          />
          <KPICard
            icon="pricetag"
            label={t('price_sqm')}
            value={stats ? formatNumber(stats.avgPricePerSqm) : "No data"}
            suffix=" AED"
          />
          <KPICard
            icon="arrow-up-circle"
            label={t('growth')}
            value={stats ? `+${stats.avgGrowth}` : "No data"}
            suffix="%"
            color={stats && stats.avgGrowth > 0 ? C.green : C.red}
          />
          <KPICard
            icon="swap-horizontal"
            label={t('transactions')}
            value={stats ? formatNumber(stats.totalTransactions) : "No data"}
          />
        </View>

        <View style={styles.volumeCard}>
          <View style={styles.volumeRow}>
            <MaterialCommunityIcons name="chart-areaspline" size={22} color={C.tint} />
            <Text style={styles.volumeTitle}>{t('total_volume')}</Text>
          </View>
          <Text style={styles.volumeValue}>
            {stats ? stats.totalValueBillions : "No data"} <Text style={styles.volumeUnit}>Mds AED</Text>
          </Text>
          <Text style={styles.volumeSub}>
            {stats?.districtCount ?? 0} {t('districts_analyzed')}
          </Text>
        </View>

        <View style={styles.statusRow}>
          <View style={[styles.statusCard, { borderLeftColor: C.green }]}>
            <Text style={[styles.statusNum, { color: C.green }]}>{greenZones}</Text>
            <Text style={styles.statusLabel}>{t('opportunities')}</Text>
          </View>
          <View style={[styles.statusCard, { borderLeftColor: C.orange }]}>
            <Text style={[styles.statusNum, { color: C.orange }]}>{warningZones}</Text>
            <Text style={styles.statusLabel}>{t('warning')}</Text>
          </View>
          <View style={[styles.statusCard, { borderLeftColor: "#8BA3C7" }]}>
            <Text style={[styles.statusNum, { color: "#8BA3C7" }]}>
              {(districts || []).filter((d: any) => d.statusLabel === "stable").length}
            </Text>
            <Text style={styles.statusLabel}>{t('stable')}</Text>
          </View>
        </View>

        {topOpportunities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('top_opportunities')}</Text>
            {topOpportunities.map((opp: any, idx: number) => (
              <View key={opp.id} style={styles.oppCard}>
                <View style={styles.oppRank}>
                  <Text style={styles.oppRankText}>#{idx + 1}</Text>
                </View>
                <View style={styles.oppInfo}>
                  <Text style={styles.oppName}>{opp.district?.name}</Text>
                  <Text style={styles.oppMeta}>
                    Score: {opp.attractivenessScore}/10 | {opp.investorProfile}
                  </Text>
                </View>
                <View style={styles.oppScores}>
                  <Text style={[styles.oppScore, { color: C.green }]}>
                    {opp.yieldScore?.toFixed(1)}
                  </Text>
                  <Text style={styles.oppScoreLabel}>Yield</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerTitle: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: C.white,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    marginTop: 2,
  },
  langSelector: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: C.card,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: C.border,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langBtnActive: {
    backgroundColor: C.tint,
  },
  langText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 10,
    color: C.textSecondary,
  },
  langTextActive: {
    color: C.white,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  kpiValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 22,
    color: C.white,
  },
  kpiSuffix: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: C.textSecondary,
  },
  kpiLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  volumeCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  volumeTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: C.textSecondary,
  },
  volumeValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 32,
    color: C.tint,
  },
  volumeUnit: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: C.textSecondary,
  },
  volumeSub: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.textMuted,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statusCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  statusNum: {
    fontFamily: "DMSans_700Bold",
    fontSize: 24,
  },
  statusLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 18,
    color: C.white,
    marginBottom: 12,
  },
  oppCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  oppRank: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: C.tint + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  oppRankText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 14,
    color: C.tint,
  },
  oppInfo: { flex: 1 },
  oppName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: C.white,
  },
  oppMeta: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  oppScores: { alignItems: "center", marginLeft: 8 },
  oppScore: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
  },
  oppScoreLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: C.textMuted,
  },
});
