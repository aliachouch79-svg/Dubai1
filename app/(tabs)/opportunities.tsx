import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";

const C = Colors.light;

function ScoreBar({ score, maxScore = 10, color }: { score: number; maxScore?: number; color: string }) {
  const pct = Math.min((score / maxScore) * 100, 100);
  return (
    <View style={styles.scoreBarBg}>
      <View style={[styles.scoreBarFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

function OpportunityCard({ item, rank }: { item: any; rank: number }) {
  const { t } = useLanguage();
  const recColor = item.recommendation === "Achat recommande"
    ? C.green
    : item.recommendation === "Opportunite selective"
    ? C.tint
    : item.recommendation === "Prudence - risque supply"
    ? C.red
    : C.textSecondary;

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
        <View style={styles.cardTitle}>
          <Text style={styles.districtName}>{item.district?.name}</Text>
          <Text style={styles.districtCategory}>{item.district?.category}</Text>
        </View>
        <View style={styles.scoreCircle}>
          <Text style={styles.scoreValue}>{item.attractivenessScore}</Text>
          <Text style={styles.scoreMax}>/10</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{t('yield')}</Text>
          <ScoreBar score={item.yieldScore || 0} color={C.green} />
          <Text style={styles.metricValue}>{(item.yieldScore || 0).toFixed(1)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>{t('growth')}</Text>
          <ScoreBar score={item.capitalGrowthScore || 0} color={C.tint} />
          <Text style={styles.metricValue}>{(item.capitalGrowthScore || 0).toFixed(1)}</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Supply Risk</Text>
          <ScoreBar score={item.supplyRiskScore || 0} color="#7ED6DF" />
          <Text style={styles.metricValue}>{(item.supplyRiskScore || 0).toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.cardBottom}>
        <View style={[styles.recBadge, { backgroundColor: recColor + "18", borderColor: recColor + "40" }]}>
          <Text style={[styles.recText, { color: recColor }]}>{item.recommendation}</Text>
        </View>
        <View style={styles.profileTag}>
          <Ionicons name="person-outline" size={12} color={C.textMuted} />
          <Text style={styles.profileText}>{item.investorProfile}</Text>
        </View>
      </View>
    </View>
  );
}

export default function OpportunitiesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { t } = useLanguage();

  const { data: opportunities, isLoading } = useQuery<any[]>({
    queryKey: ["/api/opportunities"],
  });

  const highYield = (opportunities || []).filter((o: any) => (o.yieldScore || 0) >= 7);
  const highGrowth = (opportunities || []).filter((o: any) => (o.capitalGrowthScore || 0) >= 7);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topPad + 12 }]}>
        <Text style={styles.title}>{t('opportunities')}</Text>
        <Text style={styles.subtitle}>{t('top_opportunities')}</Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: C.green }]}>
          <MaterialCommunityIcons name="cash-multiple" size={18} color={C.green} />
          <Text style={[styles.summaryNum, { color: C.green }]}>{highYield.length}</Text>
          <Text style={styles.summaryLabel}>{t('yield')} &gt; 7</Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: C.tint }]}>
          <Ionicons name="trending-up" size={18} color={C.tint} />
          <Text style={[styles.summaryNum, { color: C.tint }]}>{highGrowth.length}</Text>
          <Text style={styles.summaryLabel}>{t('growth')} &gt; 7</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={C.tint} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={opportunities}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => <OpportunityCard item={item} rank={index + 1} />}
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
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderWidth: 1,
    borderColor: C.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  summaryNum: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
  },
  summaryLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: C.textMuted,
    flex: 1,
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
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.tint + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rankText: {
    fontFamily: "DMSans_700Bold",
    fontSize: 13,
    color: C.tint,
  },
  cardTitle: { flex: 1 },
  districtName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: C.white,
  },
  districtCategory: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: C.textMuted,
  },
  scoreCircle: {
    flexDirection: "row",
    alignItems: "baseline",
    backgroundColor: C.tint + "15",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  scoreValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 20,
    color: C.tint,
  },
  scoreMax: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.textMuted,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  metric: { flex: 1 },
  metricLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 4,
  },
  metricValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
    color: C.white,
    marginTop: 3,
    textAlign: "right",
  },
  scoreBarBg: {
    height: 4,
    backgroundColor: C.border,
    borderRadius: 2,
  },
  scoreBarFill: {
    height: 4,
    borderRadius: 2,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  recText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
  },
  profileTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  profileText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: C.textMuted,
  },
});
