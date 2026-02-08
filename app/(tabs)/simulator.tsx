import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { apiRequest, queryClient } from "@/lib/query-client";
import { useFavorites } from "@/contexts/FavoritesContext";
import Colors from "@/constants/colors";

const C = Colors.light;

function parseNum(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, "")) || 0;
}

function ResultRow({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <View style={styles.resultRow}>
      <Text style={styles.resultLabel}>{label}</Text>
      <Text style={[styles.resultValue, color ? { color } : {}, bold ? { fontFamily: "DMSans_700Bold" } : {}]}>
        {value}
      </Text>
    </View>
  );
}

export default function SimulatorScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { sessionId } = useFavorites();

  const [purchasePrice, setPurchasePrice] = useState("1500000");
  const [downPayment, setDownPayment] = useState("375000");
  const [annualRent, setAnnualRent] = useState("90000");
  const [charges, setCharges] = useState("15000");
  const [vacancy, setVacancy] = useState("5");
  const [resalePrice, setResalePrice] = useState("1800000");
  const [holdYears, setHoldYears] = useState("5");

  const results = useMemo(() => {
    const price = parseNum(purchasePrice);
    const down = parseNum(downPayment);
    const rent = parseNum(annualRent);
    const chr = parseNum(charges);
    const vac = parseNum(vacancy) / 100;
    const resale = parseNum(resalePrice);
    const years = parseInt(holdYears) || 5;

    if (price <= 0) return null;

    const effectiveRent = rent * (1 - vac);
    const netRent = effectiveRent - chr;
    const grossYield = (rent / price) * 100;
    const netYield = (netRent / price) * 100;

    const totalCashflow = netRent * years;
    const capitalGain = resale - price;
    const totalReturn = totalCashflow + capitalGain;
    const roi = ((totalReturn) / down) * 100;

    const cashflows = [-down];
    for (let i = 0; i < years; i++) cashflows.push(netRent);
    cashflows[cashflows.length - 1] += resale;

    let irr = 0.1;
    for (let iter = 0; iter < 100; iter++) {
      let npv = 0;
      let dnpv = 0;
      for (let t = 0; t < cashflows.length; t++) {
        npv += cashflows[t] / Math.pow(1 + irr, t);
        dnpv -= t * cashflows[t] / Math.pow(1 + irr, t + 1);
      }
      if (Math.abs(npv) < 0.01) break;
      irr -= npv / dnpv;
    }

    const projections = [];
    for (let y = 1; y <= years; y++) {
      const cumCashflow = netRent * y;
      const estValue = price + (capitalGain / years) * y;
      projections.push({
        year: y,
        cashflow: Math.round(cumCashflow),
        value: Math.round(estValue),
        totalReturn: Math.round(cumCashflow + estValue - price),
      });
    }

    return {
      grossYield: grossYield.toFixed(1),
      netYield: netYield.toFixed(1),
      annualCashflow: Math.round(netRent),
      totalCashflow: Math.round(totalCashflow),
      capitalGain: Math.round(capitalGain),
      totalReturn: Math.round(totalReturn),
      roi: roi.toFixed(1),
      irr: (irr * 100).toFixed(1),
      projections,
    };
  }, [purchasePrice, downPayment, annualRent, charges, vacancy, resalePrice, holdYears]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/simulations", {
        sessionId,
        name: `Simulation ${new Date().toLocaleDateString()}`,
        inputs: { purchasePrice, downPayment, annualRent, charges, vacancy, resalePrice, holdYears },
        results,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/simulations"] });
      Alert.alert("Sauvegarde", "Simulation sauvegardee dans vos favoris.");
    },
  });

  function InputField({ label, value, onChangeText, suffix }: { label: string; value: string; onChangeText: (t: string) => void; suffix?: string }) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>{label}</Text>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            keyboardType="numeric"
            placeholderTextColor={C.textMuted}
          />
          {suffix && <Text style={styles.inputSuffix}>{suffix}</Text>}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 12, paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Simulateur ROI</Text>
        <Text style={styles.subtitle}>Estimez votre retour sur investissement</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parametres</Text>
          <InputField label="Prix d'achat" value={purchasePrice} onChangeText={setPurchasePrice} suffix="AED" />
          <InputField label="Apport" value={downPayment} onChangeText={setDownPayment} suffix="AED" />
          <InputField label="Loyer annuel" value={annualRent} onChangeText={setAnnualRent} suffix="AED" />
          <InputField label="Charges annuelles" value={charges} onChangeText={setCharges} suffix="AED" />
          <InputField label="Vacance locative" value={vacancy} onChangeText={setVacancy} suffix="%" />
          <InputField label="Revente estimee" value={resalePrice} onChangeText={setResalePrice} suffix="AED" />
          <InputField label="Duree detention" value={holdYears} onChangeText={setHoldYears} suffix="ans" />
        </View>

        {results && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>Resultats</Text>

            <View style={styles.resultsCard}>
              <ResultRow label="Yield brut" value={`${results.grossYield}%`} color={C.tint} bold />
              <ResultRow label="Yield net" value={`${results.netYield}%`} color={C.green} bold />
              <ResultRow label="Cashflow annuel" value={`${results.annualCashflow.toLocaleString()} AED`} />
              <ResultRow label="Cashflow total" value={`${results.totalCashflow.toLocaleString()} AED`} />
              <ResultRow label="Plus-value" value={`${results.capitalGain.toLocaleString()} AED`} color={results.capitalGain >= 0 ? C.green : C.red} />
              <ResultRow label="Retour total" value={`${results.totalReturn.toLocaleString()} AED`} color={C.tint} bold />
              <ResultRow label="ROI sur apport" value={`${results.roi}%`} color={C.tint} bold />
              <ResultRow label="TRI (IRR)" value={`${results.irr}%`} color={C.green} bold />
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Projection</Text>
            <View style={styles.projectionCard}>
              <View style={styles.projHeader}>
                <Text style={styles.projHeaderText}>An</Text>
                <Text style={styles.projHeaderText}>Cashflow cum.</Text>
                <Text style={styles.projHeaderText}>Val. estimee</Text>
                <Text style={styles.projHeaderText}>Gain total</Text>
              </View>
              {results.projections.map((p) => (
                <View key={p.year} style={styles.projRow}>
                  <Text style={styles.projCell}>{p.year}</Text>
                  <Text style={styles.projCell}>{(p.cashflow / 1000).toFixed(0)}K</Text>
                  <Text style={styles.projCell}>{(p.value / 1000000).toFixed(2)}M</Text>
                  <Text style={[styles.projCell, { color: p.totalReturn >= 0 ? C.green : C.red }]}>
                    {(p.totalReturn / 1000).toFixed(0)}K
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() => saveMutation.mutate()}
              activeOpacity={0.7}
            >
              <Ionicons name="bookmark-outline" size={18} color={C.background} />
              <Text style={styles.saveBtnText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 16 },
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
    marginBottom: 20,
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 16,
    color: C.white,
    marginBottom: 12,
  },
  inputGroup: { marginBottom: 12 },
  inputLabel: {
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: 16,
    color: C.white,
    paddingVertical: 12,
  },
  inputSuffix: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.textMuted,
    marginLeft: 8,
  },
  resultsSection: {},
  resultsCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  resultLabel: {
    fontFamily: "DMSans_400Regular",
    fontSize: 13,
    color: C.textSecondary,
  },
  resultValue: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: C.white,
  },
  projectionCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  projHeader: {
    flexDirection: "row",
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    marginBottom: 4,
  },
  projHeaderText: {
    flex: 1,
    fontFamily: "DMSans_600SemiBold",
    fontSize: 11,
    color: C.textMuted,
    textAlign: "center",
  },
  projRow: {
    flexDirection: "row",
    paddingVertical: 6,
  },
  projCell: {
    flex: 1,
    fontFamily: "DMSans_500Medium",
    fontSize: 13,
    color: C.white,
    textAlign: "center",
  },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.tint,
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 20,
    gap: 8,
  },
  saveBtnText: {
    fontFamily: "DMSans_600SemiBold",
    fontSize: 15,
    color: C.background,
  },
});
