import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useFavorites } from "@/contexts/FavoritesContext";
import Colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";

const C = Colors.light;
const screenWidth = Dimensions.get("window").width;

const RANGES = ["3M", "6M", "1Y", "3Y", "All"];
const CHART_TYPES = ["price", "rent", "yield", "volume"];

function MarketTrendsChart({ districtId }: { districtId: number }) {
  const { t } = useLanguage();
  const [range, setRange] = useState("1Y");
  const [chartType, setChartType] = useState("price");

  const { data: trends, isLoading } = useQuery<any[]>({
    queryKey: ["/api/market/trends", districtId, range],
    enabled: !!districtId,
  });

  if (isLoading) return <ActivityIndicator size="small" color={C.tint} style={{ height: 200 }} />;
  if (!trends || trends.length === 0) return <View style={styles.emptyChart}><Text style={styles.emptyText}>{t('no_data') || "Aucune donnée disponible"}</Text></View>;

  const getChartData = () => {
    let data = [];
    let color = (opacity = 1) => `rgba(186, 151, 88, ${opacity})`;
    
    switch(chartType) {
      case "price":
        data = trends.map(s => s.avgPricePerSqm);
        break;
      case "rent":
        data = trends.map(s => s.avgRentNew);
        color = (opacity = 1) => `rgba(126, 214, 223, ${opacity})`;
        break;
      case "yield":
        data = trends.map(s => s.grossYield);
        color = (opacity = 1) => `rgba(38, 222, 129, ${opacity})`;
        break;
      case "volume":
        data = trends.map(s => s.transactionVolume);
        color = (opacity = 1) => `rgba(139, 163, 199, ${opacity})`;
        break;
    }

    return {
      labels: trends.map(s => s.year.toString().slice(-2)),
      datasets: [{
        data: data.map(v => v || 0),
        color: color,
        strokeWidth: 2
      }]
    };
  };

  const labels: Record<string, string> = {
    price: t('price_evolution_sqm') || "Évolution du prix au m²",
    rent: t('rent_evolution') || "Évolution des loyers",
    yield: t('yield_evolution') || "Évolution du yield",
    volume: t('volume_evolution') || "Volume des transactions"
  };

  return (
    <View style={styles.chartContainer}>
      <View style={styles.typeSelector}>
        {CHART_TYPES.map(type => (
          <TouchableOpacity 
            key={type} 
            onPress={() => setChartType(type)}
            style={[styles.typeBtn, chartType === type && styles.typeBtnActive]}
          >
            <Ionicons 
              name={type === "price" ? "pricetag" : type === "rent" ? "home" : type === "yield" ? "trending-up" : "swap-horizontal"} 
              size={14} 
              color={chartType === type ? C.tint : C.textMuted} 
            />
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.rangeSelector}>
        {RANGES.map(r => (
          <TouchableOpacity 
            key={r} 
            onPress={() => setRange(r)}
            style={[styles.rangeBtn, range === r && styles.rangeBtnActive]}
          >
            <Text style={[styles.rangeBtnText, range === r && styles.rangeBtnTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <LineChart
        data={getChartData()}
        width={screenWidth - 32}
        height={200}
        chartConfig={{
          backgroundColor: C.card,
          backgroundGradientFrom: C.card,
          backgroundGradientTo: C.card,
          decimalPlaces: chartType === "yield" ? 1 : 0,
          color: (opacity = 1) => chartType === "rent" ? `rgba(126, 214, 223, ${opacity})` : chartType === "yield" ? `rgba(38, 222, 129, ${opacity})` : `rgba(186, 151, 88, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(139, 163, 199, ${opacity})`,
          style: { borderRadius: 16 },
          propsForDots: { r: "4", strokeWidth: "2", stroke: C.tint }
        }}
        bezier
        style={{ marginVertical: 8, borderRadius: 16 }}
      />
      <Text style={styles.chartLegend}>{labels[chartType]}</Text>
    </View>
  );
}

function MetricCard({ label, value, suffix, color, icon }: { label: string; value: string; suffix?: string; color?: string; icon?: string }) {
  return (
    <View style={styles.metricCard}>
      {icon && <Ionicons name={icon as any} size={16} color={color || C.textMuted} style={{ marginBottom: 4 }} />}
      <Text style={[styles.metricValue, color ? { color } : {}]}>
        {value ?? "No data"}
        {suffix && value !== undefined ? <Text style={styles.metricSuffix}>{suffix}</Text> : null}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

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

function SupplyRiskBadge({ level }: { level: string }) {
  const { t } = useLanguage();
  const colors: Record<string, string> = { low: C.green, moderate: C.orange, high: C.red };
  const labels: Record<string, string> = { low: t('low') || "Faible", moderate: t('moderate') || "Modere", high: t('high') || "Eleve" };
  const col = colors[level] || C.textMuted;
  return (
    <View style={[styles.supplyBadge, { backgroundColor: col + "15", borderColor: col + "30" }]}>
      <Text style={[styles.supplyBadgeText, { color: col }]}>{labels[level] || level}</Text>
    </View>
  );
}

export default function DistrictDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useLanguage();

  const districtId = parseInt(id as string);

  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/districts", id],
  });

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: topPad + 20 }]}>
        <ActivityIndicator size="large" color={C.tint} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.container, { paddingTop: topPad + 20 }]}>
        <Text style={styles.errorText}>{t('district_not_found') || "Quartier introuvable"}</Text>
      </View>
    );
  }

  const { district, stats, supply } = data || {};
  if (!district) return <View style={[styles.container, { paddingTop: topPad + 20 }]}><Text style={styles.errorText}>{t('district_not_found') || "Quartier introuvable"}</Text></View>;
  
  const latest = stats && stats.length > 0 ? stats[0] : null;
  const previous = stats && stats.length > 1 ? stats[1] : null;
  const latestSupply = supply && supply.length > 0 ? supply[supply.length - 1] : null;
  const fav = isFavorite(districtId);

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.white} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => toggleFavorite(districtId)} style={styles.favBtn}>
          <Ionicons name={fav ? "heart" : "heart-outline"} size={24} color={fav ? C.red : C.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 56, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.districtName}>{district.name}</Text>
          <View style={styles.tagRow}>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{district.category}</Text>
            </View>
            <StatusBadge label={district.statusLabel} />
          </View>
          <Text style={styles.description}>{district.description}</Text>
          <Text style={styles.typology}>
            <Ionicons name="home-outline" size={13} color={C.textMuted} /> {district.dominantTypology}
          </Text>
        </View>

        {latest && (
          <>
            <Text style={styles.sectionTitle}>{t('market_intelligence')} ({latest.year})</Text>
            <View style={styles.metricsGrid}>
              <MetricCard label={t('price_sqm')} value={latest.avgPricePerSqm?.toLocaleString()} suffix=" AED" icon="pricetag-outline" />
              <MetricCard label={t('growth')} value={latest.priceChangePercent !== undefined ? `${latest.priceChangePercent > 0 ? '+' : ''}${latest.priceChangePercent}` : undefined} suffix="%" color={latest.priceChangePercent > 0 ? C.green : C.red} icon="trending-up-outline" />
              <MetricCard label={t('yield')} value={latest.grossYield?.toFixed(1)} suffix="%" color={C.tint} icon="cash-outline" />
              <MetricCard label="Yield net" value={latest.netYield?.toFixed(1)} suffix="%" color={C.green} icon="wallet-outline" />
            </View>

            <Text style={styles.sectionTitle}>{t('market_trends') || "Tendances du Marché"}</Text>
            <MarketTrendsChart districtId={districtId} />

            <Text style={styles.sectionTitle}>{t('rents') || "Loyers"}</Text>
            <View style={styles.rentRow}>
              <View style={styles.rentCard}>
                <Text style={styles.rentLabel}>{t('new_lease') || "Nouveau bail"}</Text>
                <Text style={styles.rentValue}>{latest.avgRentNew?.toLocaleString()} <Text style={styles.rentUnit}>AED/an</Text></Text>
              </View>
              <View style={styles.rentCard}>
                <Text style={styles.rentLabel}>{t('renewal') || "Renouvellement"}</Text>
                <Text style={styles.rentValue}>{latest.avgRentRenewed?.toLocaleString()} <Text style={styles.rentUnit}>AED/an</Text></Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{t('transactions')}</Text>
            <View style={styles.transCard}>
              <View style={styles.transRow}>
                <Text style={styles.transLabel}>Volume</Text>
                <Text style={styles.transValue}>{latest.transactionVolume?.toLocaleString()}</Text>
              </View>
              <View style={styles.transRow}>
                <Text style={styles.transLabel}>Off-plan</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { width: `${latest.offPlanShare}%`, backgroundColor: C.tint }]} />
                </View>
                <Text style={styles.transPercent}>{latest.offPlanShare}%</Text>
              </View>
              <View style={styles.transRow}>
                <Text style={styles.transLabel}>Ready</Text>
                <View style={styles.barContainer}>
                  <View style={[styles.bar, { width: `${latest.readyShare}%`, backgroundColor: C.green }]} />
                </View>
                <Text style={styles.transPercent}>{latest.readyShare}%</Text>
              </View>
            </View>
          </>
        )}

        {previous && (
          <>
            <Text style={styles.sectionTitle}>{t('evolution') || "Evolution"} {previous.year} vs {latest.year}</Text>
            <View style={styles.evolutionCard}>
              <View style={styles.evoRow}>
                <Text style={styles.evoLabel}>{t('price_sqm')}</Text>
                <Text style={styles.evoOld}>{previous.avgPricePerSqm?.toLocaleString()}</Text>
                <Ionicons name="arrow-forward" size={14} color={C.textMuted} />
                <Text style={styles.evoNew}>{latest.avgPricePerSqm?.toLocaleString()}</Text>
              </View>
              <View style={styles.evoRow}>
                <Text style={styles.evoLabel}>{t('yield')}</Text>
                <Text style={styles.evoOld}>{previous.grossYield?.toFixed(1)}%</Text>
                <Ionicons name="arrow-forward" size={14} color={C.textMuted} />
                <Text style={styles.evoNew}>{latest.grossYield?.toFixed(1)}%</Text>
              </View>
              <View style={styles.evoRow}>
                <Text style={styles.evoLabel}>{t('new_lease') || "Loyer nouveau"}</Text>
                <Text style={styles.evoOld}>{previous.avgRentNew?.toLocaleString()}</Text>
                <Ionicons name="arrow-forward" size={14} color={C.textMuted} />
                <Text style={styles.evoNew}>{latest.avgRentNew?.toLocaleString()}</Text>
              </View>
            </View>
          </>
        )}

        {latestSupply && (
          <>
            <Text style={styles.sectionTitle}>Pipeline Supply</Text>
            <View style={styles.supplyCard}>
              <View style={styles.supplyHeader}>
                <Text style={styles.supplyYear}>{t('year') || "Annee"} {latestSupply.year}</Text>
                <SupplyRiskBadge level={latestSupply.supplyRiskLevel} />
              </View>
              <View style={styles.supplyMetrics}>
                <View style={styles.supplyMetric}>
                  <Text style={styles.supplyMetricValue}>{latestSupply.unitsPlanned?.toLocaleString()}</Text>
                  <Text style={styles.supplyMetricLabel}>{t('planned_units') || "Unites planifiees"}</Text>
                </View>
                <View style={styles.supplyMetric}>
                  <Text style={styles.supplyMetricValue}>{latestSupply.unitsDelivered?.toLocaleString()}</Text>
                  <Text style={styles.supplyMetricLabel}>{t('delivered_units') || "Unites livrees"}</Text>
                </View>
                <View style={styles.supplyMetric}>
                  <Text style={[styles.supplyMetricValue, { color: C.orange }]}>
                    {latestSupply.unitsPlanned && latestSupply.unitsDelivered
                      ? ((latestSupply.unitsDelivered / latestSupply.unitsPlanned) * 100).toFixed(0)
                      : 0}%
                  </Text>
                  <Text style={styles.supplyMetricLabel}>{t('delivery_rate') || "Taux livraison"}</Text>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
    zIndex: 10,
    backgroundColor: C.background,
  },
  backBtn: { padding: 4 },
  favBtn: { padding: 4 },
  scroll: { paddingHorizontal: 16 },
  errorText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 16,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 60,
  },
  titleSection: { marginBottom: 24 },
  districtName: {
    fontFamily: "DMSans_700Bold",
    fontSize: 28,
    color: C.white,
    marginBottom: 8,
  },
  tagRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  categoryTag: {
    backgroundColor: C.tint + "20",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 12,
    color: C.tint,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  badgeText: { fontFamily: "DMSans_600SemiBold", fontSize: 10 },
  description: {
    fontFamily: "DMSans_400Regular",
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  typology: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.textMuted,
  },
  sectionTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: C.white,
    marginBottom: 12,
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  metricValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 18,
    color: C.white,
  },
  metricSuffix: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.textSecondary,
  },
  metricLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
  },
  rentRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  rentCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  rentLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 4,
  },
  rentValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: C.white,
  },
  rentUnit: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.textSecondary,
  },
  transCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  transRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  transLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    width: 70,
  },
  transValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: C.white,
    flex: 1,
    textAlign: "right",
  },
  barContainer: {
    flex: 1,
    height: 6,
    backgroundColor: C.border,
    borderRadius: 3,
    marginHorizontal: 10,
  },
  bar: { height: 6, borderRadius: 3 },
  transPercent: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 13,
    color: C.white,
    width: 40,
    textAlign: "right",
  },
  evolutionCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  evoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    gap: 8,
  },
  evoLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.textSecondary,
    flex: 1,
  },
  evoOld: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: C.textMuted,
  },
  evoNew: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 14,
    color: C.tint,
  },
  supplyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  supplyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  supplyYear: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: C.white,
  },
  supplyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  supplyBadgeText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
  },
  supplyMetrics: { flexDirection: "row", gap: 10 },
  supplyMetric: {
    flex: 1,
    backgroundColor: C.background,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  supplyMetricValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
    color: C.white,
  },
  supplyMetricLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: C.textMuted,
    marginTop: 2,
    textAlign: "center",
  },
  chartContainer: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  rangeSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
  },
  typeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: C.border,
  },
  typeBtnActive: {
    borderColor: C.tint,
    backgroundColor: C.tint + "10",
  },
  rangeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: C.background,
    borderWidth: 1,
    borderColor: C.border,
  },
  rangeBtnActive: {
    backgroundColor: C.tint + "20",
    borderColor: C.tint,
  },
  rangeBtnText: {
    fontFamily: "DMSans_500Medium",
    fontSize: 11,
    color: C.textMuted,
  },
  rangeBtnTextActive: {
    color: C.tint,
  },
  chartLegend: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
  emptyChart: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.textMuted,
  },
});
