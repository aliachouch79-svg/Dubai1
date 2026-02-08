import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFavorites } from "@/contexts/FavoritesContext";
import { apiRequest, queryClient } from "@/lib/query-client";
import Colors from "@/constants/colors";

const C = Colors.light;

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const router = useRouter();
  const { sessionId } = useFavorites();

  const { data: favData, isLoading: favsLoading } = useQuery<any[]>({
    queryKey: ["/api/favorites", sessionId],
    enabled: !!sessionId,
  });

  const { data: sims, isLoading: simsLoading } = useQuery<any[]>({
    queryKey: ["/api/simulations", sessionId],
    enabled: !!sessionId,
  });

  const deleteSim = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/simulations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/simulations", sessionId] });
    },
  });

  const { toggleFavorite } = useFavorites();

  const { t } = { t: (key: string) => "" }; // Fallback if t is not defined
    const favoriteDistricts = (favData || []).filter((f: any) => f && f.district);

    const renderDistrict = (fav: any) => {
        if (!fav || !fav.district) return null;
        return (
            <TouchableOpacity
                key={fav.id}
                style={styles.favCard}
                onPress={() => router.push(`/district/${fav.district.id}`)}
                activeOpacity={0.7}
            >
                <View style={styles.favInfo}>
                    <Text style={styles.favName}>{fav.district.name ?? "Quartier inconnu"}</Text>
                    <Text style={styles.favMeta}>{(fav.district.category || "N/A")} | {(fav.district.marketStatus || "N/A")}</Text>
                </View>
                <TouchableOpacity
                    onPress={() => toggleFavorite(fav.district.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="heart" size={22} color={C.red} />
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const renderSimulation = (sim: any) => {
        if (!sim) return null;
        const inputs = sim.inputs || {};
        const results = sim.results || {};
        return (
            <View key={sim.id} style={styles.simCard}>
                <View style={styles.simHeader}>
                    <Text style={styles.simName}>{sim.name || "Simulation"}</Text>
                    <TouchableOpacity
                        onPress={() => deleteSim.mutate(sim.id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="trash-outline" size={18} color={C.textMuted} />
                    </TouchableOpacity>
                </View>
                <Text style={styles.simMeta}>
                    Prix: {parseInt(inputs.purchasePrice || 0).toLocaleString()} AED | Loyer: {parseInt(inputs.annualRent || 0).toLocaleString()} AED
                </Text>
                <View style={styles.simResults}>
                    <View style={styles.simMetric}>
                        <Text style={styles.simMetricLabel}>Yield net</Text>
                        <Text style={[styles.simMetricValue, { color: C.green }]}>{results.netYield || 0}%</Text>
                    </View>
                    <View style={styles.simMetric}>
                        <Text style={styles.simMetricLabel}>ROI</Text>
                        <Text style={[styles.simMetricValue, { color: C.tint }]}>{results.roi || 0}%</Text>
                    </View>
                    <View style={styles.simMetric}>
                        <Text style={styles.simMetricLabel}>TRI</Text>
                        <Text style={[styles.simMetricValue, { color: C.green }]}>{results.irr || 0}%</Text>
                    </View>
                </View>
                <Text style={styles.simDate}>
                    {sim.createdAt ? new Date(sim.createdAt).toLocaleDateString() : "Date inconnue"}
                </Text>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: topPad + 12 }]}>
                <Text style={styles.title}>Favoris & Simulations</Text>
                <Text style={styles.subtitle}>Vos quartiers et scenarios sauvegardes</Text>
            </View>

            <FlatList
                data={[]}
                keyExtractor={() => "dummy"}
                renderItem={() => null}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
                ListHeaderComponent={
                    <>
                        <Text style={styles.sectionTitle}>
                            Quartiers favoris ({favoriteDistricts.length})
                        </Text>

                        {favsLoading ? (
                            <ActivityIndicator color={C.tint} style={{ marginVertical: 20 }} />
                        ) : favoriteDistricts.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="heart-outline" size={28} color={C.textMuted} />
                                <Text style={styles.emptyText}>
                                    Aucun quartier favori. Explorez les quartiers et ajoutez-les à vos favoris.
                                </Text>
                            </View>
                        ) : (
                            favoriteDistricts.map(renderDistrict)
                        )}

                        <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                            Simulations sauvegardees ({(sims || []).length})
                        </Text>

                        {simsLoading ? (
                            <ActivityIndicator color={C.tint} style={{ marginVertical: 20 }} />
                        ) : (sims || []).length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="calculator-outline" size={28} color={C.textMuted} />
                                <Text style={styles.emptyText}>
                                    Aucune simulation sauvegardee. Utilisez le simulateur pour creer un scenario.
                                </Text>
                            </View>
                        ) : (
                            (sims || []).map(renderSimulation)
                        )}
                    </>
                }
            />
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
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  sectionTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: C.white,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: C.border,
    gap: 10,
  },
  emptyText: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  favCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  favInfo: { flex: 1 },
  favName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: C.white,
  },
  favMeta: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.textMuted,
    marginTop: 2,
  },
  simCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  simHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  simName: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: C.white,
  },
  simMeta: {
    fontFamily: "DMSans_400Regular",
    fontSize: 12,
    color: C.textSecondary,
    marginBottom: 10,
  },
  simResults: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
  },
  simMetric: {
    flex: 1,
    backgroundColor: C.background,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  simMetricLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 10,
    color: C.textMuted,
    marginBottom: 2,
  },
  simMetricValue: {
    fontFamily: "DMSans_700Bold",
    fontSize: 16,
  },
  simDate: {
    fontFamily: "DMSans_400Regular",
    fontSize: 11,
    color: C.textMuted,
    textAlign: "right",
  },
});
