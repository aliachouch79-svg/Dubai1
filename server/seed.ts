import { db } from "./db";
import {
  districts,
  marketStats,
  supplyPipeline,
  investmentOpportunities,
} from "@shared/schema";
import { sql } from "drizzle-orm";

const DISTRICTS_DATA = [
  {
    name: "Dubai Marina",
    category: "Premium",
    description: "Zone résidentielle premium en bord de mer avec gratte-ciels et marina. Très prisée par les expatriés et investisseurs.",
    latitude: 25.0805,
    longitude: 55.1403,
    dominantTypology: "1BR / 2BR Apartments",
    marketStatus: "Mature / Stable",
    statusLabel: "stable",
  },
  {
    name: "Downtown Dubai",
    category: "Ultra Premium",
    description: "Quartier iconique abritant le Burj Khalifa et Dubai Mall. Capital appreciation élevée, rendement modéré.",
    latitude: 25.1972,
    longitude: 55.2744,
    dominantTypology: "1BR / 2BR Apartments",
    marketStatus: "Capital Appreciation Zone",
    statusLabel: "opportunity",
  },
  {
    name: "Business Bay",
    category: "Premium",
    description: "Extension de Downtown le long du canal. Mélange bureaux et résidentiel. Fort dynamisme locatif.",
    latitude: 25.1851,
    longitude: 55.2719,
    dominantTypology: "Studios / 1BR",
    marketStatus: "Opportunité Rendement",
    statusLabel: "opportunity",
  },
  {
    name: "JVC (Jumeirah Village Circle)",
    category: "Middle Market",
    description: "Quartier affordable avec forte demande locative. Idéal pour investisseurs buy-to-let cherchant du yield.",
    latitude: 25.0657,
    longitude: 55.2117,
    dominantTypology: "Studios / 1BR",
    marketStatus: "Opportunité Rendement",
    statusLabel: "opportunity",
  },
  {
    name: "Palm Jumeirah",
    category: "Ultra Premium",
    description: "Île artificielle iconique. Villas et appartements de luxe. Forte appréciation du capital.",
    latitude: 25.1124,
    longitude: 55.1390,
    dominantTypology: "Villas / Penthouses",
    marketStatus: "Capital Appreciation Zone",
    statusLabel: "opportunity",
  },
  {
    name: "Dubai Hills Estate",
    category: "Premium",
    description: "Communauté familiale avec golf, parcs et écoles internationales. Forte croissance prix.",
    latitude: 25.1040,
    longitude: 55.2428,
    dominantTypology: "Villas / Townhouses",
    marketStatus: "Capital Appreciation Zone",
    statusLabel: "opportunity",
  },
  {
    name: "JBR (Jumeirah Beach Residence)",
    category: "Premium",
    description: "Front de mer avec accès plage direct. Forte demande touristique et short-term rentals.",
    latitude: 25.0778,
    longitude: 55.1337,
    dominantTypology: "1BR / 2BR Apartments",
    marketStatus: "Mature / Stable",
    statusLabel: "stable",
  },
  {
    name: "Creek Harbour",
    category: "Emerging Premium",
    description: "Nouveau quartier Emaar face à la Creek. Potentiel de croissance important. Off-plan dominant.",
    latitude: 25.1938,
    longitude: 55.3439,
    dominantTypology: "1BR / 2BR Apartments",
    marketStatus: "Emerging Growth",
    statusLabel: "opportunity",
  },
  {
    name: "DIFC",
    category: "Ultra Premium",
    description: "Centre financier international. Clientèle corporate et HNW. Loyers premium.",
    latitude: 25.2100,
    longitude: 55.2791,
    dominantTypology: "1BR / 2BR Apartments",
    marketStatus: "Mature / Premium",
    statusLabel: "stable",
  },
  {
    name: "Dubai South",
    category: "Emerging",
    description: "Zone d'avenir près d'Al Maktoum Airport et Expo City. Prix d'entrée bas, fort potentiel.",
    latitude: 24.9500,
    longitude: 55.1700,
    dominantTypology: "Studios / 1BR",
    marketStatus: "Emerging Growth",
    statusLabel: "opportunity",
  },
  {
    name: "Jumeirah Lake Towers (JLT)",
    category: "Middle Market",
    description: "Quartier mixed-use abordable adjacent à Marina. Bon yield, proximité métro.",
    latitude: 25.0764,
    longitude: 55.1466,
    dominantTypology: "Studios / 1BR",
    marketStatus: "Opportunité Rendement",
    statusLabel: "opportunity",
  },
  {
    name: "Al Furjan",
    category: "Middle Market",
    description: "Communauté résidentielle en croissance. Townhouses et villas abordables. Forte demande famille.",
    latitude: 25.0285,
    longitude: 55.1530,
    dominantTypology: "Townhouses / Villas",
    marketStatus: "Emerging Growth",
    statusLabel: "opportunity",
  },
  {
    name: "Damac Hills",
    category: "Middle Market",
    description: "Communauté avec golf course. Mix villas et appartements. Prix compétitifs.",
    latitude: 25.0150,
    longitude: 55.2340,
    dominantTypology: "Villas / Townhouses",
    marketStatus: "Zone sous pression supply",
    statusLabel: "warning",
  },
  {
    name: "Arabian Ranches",
    category: "Premium",
    description: "Communauté de villas mature et établie. Faible turnover, valeur stable.",
    latitude: 25.0578,
    longitude: 55.2623,
    dominantTypology: "Villas",
    marketStatus: "Mature / Stable",
    statusLabel: "stable",
  },
  {
    name: "Meydan",
    category: "Emerging Premium",
    description: "Zone en fort développement autour du Meydan Racecourse. Pipeline supply important.",
    latitude: 25.1650,
    longitude: 55.3020,
    dominantTypology: "Apartments / Villas",
    marketStatus: "Zone sous pression supply",
    statusLabel: "warning",
  },
];

const MARKET_STATS_2024 = [
  { district: "Dubai Marina", avgPricePerSqm: 18200, priceChange: 11.5, rentNew: 95000, rentRenewed: 82000, grossYield: 6.3, netYield: 5.4, transactions: 8500, value: 18500000000, offPlan: 35, ready: 65 },
  { district: "Downtown Dubai", avgPricePerSqm: 26500, priceChange: 14.2, rentNew: 130000, rentRenewed: 115000, grossYield: 5.1, netYield: 4.3, transactions: 6200, value: 22000000000, offPlan: 40, ready: 60 },
  { district: "Business Bay", avgPricePerSqm: 19800, priceChange: 12.8, rentNew: 98000, rentRenewed: 85000, grossYield: 6.8, netYield: 5.9, transactions: 9800, value: 16000000000, offPlan: 45, ready: 55 },
  { district: "JVC (Jumeirah Village Circle)", avgPricePerSqm: 12500, priceChange: 15.3, rentNew: 62000, rentRenewed: 55000, grossYield: 7.8, netYield: 6.9, transactions: 14500, value: 8500000000, offPlan: 55, ready: 45 },
  { district: "Palm Jumeirah", avgPricePerSqm: 28000, priceChange: 18.7, rentNew: 180000, rentRenewed: 160000, grossYield: 4.8, netYield: 3.9, transactions: 3200, value: 25000000000, offPlan: 20, ready: 80 },
  { district: "Dubai Hills Estate", avgPricePerSqm: 17500, priceChange: 16.5, rentNew: 140000, rentRenewed: 125000, grossYield: 5.6, netYield: 4.8, transactions: 7800, value: 15000000000, offPlan: 50, ready: 50 },
  { district: "JBR (Jumeirah Beach Residence)", avgPricePerSqm: 22000, priceChange: 9.8, rentNew: 115000, rentRenewed: 100000, grossYield: 6.0, netYield: 5.1, transactions: 3800, value: 8200000000, offPlan: 10, ready: 90 },
  { district: "Creek Harbour", avgPricePerSqm: 16200, priceChange: 13.4, rentNew: 85000, rentRenewed: 72000, grossYield: 7.0, netYield: 6.1, transactions: 5500, value: 7800000000, offPlan: 70, ready: 30 },
  { district: "DIFC", avgPricePerSqm: 30000, priceChange: 10.5, rentNew: 165000, rentRenewed: 148000, grossYield: 5.5, netYield: 4.6, transactions: 2100, value: 9500000000, offPlan: 15, ready: 85 },
  { district: "Dubai South", avgPricePerSqm: 9800, priceChange: 8.2, rentNew: 42000, rentRenewed: 38000, grossYield: 8.2, netYield: 7.3, transactions: 6800, value: 3200000000, offPlan: 75, ready: 25 },
  { district: "Jumeirah Lake Towers (JLT)", avgPricePerSqm: 14200, priceChange: 10.1, rentNew: 72000, rentRenewed: 64000, grossYield: 7.2, netYield: 6.3, transactions: 7200, value: 6500000000, offPlan: 20, ready: 80 },
  { district: "Al Furjan", avgPricePerSqm: 13500, priceChange: 12.0, rentNew: 85000, rentRenewed: 75000, grossYield: 6.5, netYield: 5.6, transactions: 4800, value: 5200000000, offPlan: 45, ready: 55 },
  { district: "Damac Hills", avgPricePerSqm: 11800, priceChange: 7.5, rentNew: 78000, rentRenewed: 68000, grossYield: 6.0, netYield: 5.1, transactions: 5200, value: 4800000000, offPlan: 60, ready: 40 },
  { district: "Arabian Ranches", avgPricePerSqm: 15800, priceChange: 8.8, rentNew: 160000, rentRenewed: 145000, grossYield: 5.2, netYield: 4.4, transactions: 2800, value: 7200000000, offPlan: 25, ready: 75 },
  { district: "Meydan", avgPricePerSqm: 14500, priceChange: 11.2, rentNew: 75000, rentRenewed: 65000, grossYield: 5.8, netYield: 4.9, transactions: 4200, value: 5800000000, offPlan: 65, ready: 35 },
];

const MARKET_STATS_2025 = [
  { district: "Dubai Marina", avgPricePerSqm: 19800, priceChange: 8.8, rentNew: 102000, rentRenewed: 88000, grossYield: 6.1, netYield: 5.2, transactions: 9200, value: 20500000000, offPlan: 38, ready: 62 },
  { district: "Downtown Dubai", avgPricePerSqm: 29200, priceChange: 10.2, rentNew: 140000, rentRenewed: 122000, grossYield: 5.0, netYield: 4.1, transactions: 6800, value: 24500000000, offPlan: 42, ready: 58 },
  { district: "Business Bay", avgPricePerSqm: 22100, priceChange: 11.6, rentNew: 108000, rentRenewed: 93000, grossYield: 7.0, netYield: 6.1, transactions: 10500, value: 18200000000, offPlan: 48, ready: 52 },
  { district: "JVC (Jumeirah Village Circle)", avgPricePerSqm: 13800, priceChange: 10.4, rentNew: 68000, rentRenewed: 60000, grossYield: 7.5, netYield: 6.6, transactions: 16200, value: 10200000000, offPlan: 52, ready: 48 },
  { district: "Palm Jumeirah", avgPricePerSqm: 31500, priceChange: 12.5, rentNew: 195000, rentRenewed: 175000, grossYield: 4.6, netYield: 3.7, transactions: 3600, value: 28000000000, offPlan: 22, ready: 78 },
  { district: "Dubai Hills Estate", avgPricePerSqm: 19800, priceChange: 13.1, rentNew: 155000, rentRenewed: 138000, grossYield: 5.4, netYield: 4.6, transactions: 8500, value: 17500000000, offPlan: 48, ready: 52 },
  { district: "JBR (Jumeirah Beach Residence)", avgPricePerSqm: 23500, priceChange: 6.8, rentNew: 120000, rentRenewed: 105000, grossYield: 5.8, netYield: 4.9, transactions: 4000, value: 8800000000, offPlan: 8, ready: 92 },
  { district: "Creek Harbour", avgPricePerSqm: 18000, priceChange: 11.1, rentNew: 92000, rentRenewed: 78000, grossYield: 6.8, netYield: 5.9, transactions: 6200, value: 9200000000, offPlan: 68, ready: 32 },
  { district: "DIFC", avgPricePerSqm: 32500, priceChange: 8.3, rentNew: 175000, rentRenewed: 158000, grossYield: 5.4, netYield: 4.5, transactions: 2300, value: 10500000000, offPlan: 12, ready: 88 },
  { district: "Dubai South", avgPricePerSqm: 10800, priceChange: 10.2, rentNew: 46000, rentRenewed: 41000, grossYield: 7.9, netYield: 7.0, transactions: 7500, value: 3800000000, offPlan: 72, ready: 28 },
  { district: "Jumeirah Lake Towers (JLT)", avgPricePerSqm: 15500, priceChange: 9.2, rentNew: 78000, rentRenewed: 69000, grossYield: 7.0, netYield: 6.1, transactions: 7800, value: 7200000000, offPlan: 18, ready: 82 },
  { district: "Al Furjan", avgPricePerSqm: 14800, priceChange: 9.6, rentNew: 92000, rentRenewed: 82000, grossYield: 6.3, netYield: 5.4, transactions: 5200, value: 5800000000, offPlan: 42, ready: 58 },
  { district: "Damac Hills", avgPricePerSqm: 12200, priceChange: 3.4, rentNew: 82000, rentRenewed: 72000, grossYield: 5.8, netYield: 4.9, transactions: 5800, value: 5200000000, offPlan: 62, ready: 38 },
  { district: "Arabian Ranches", avgPricePerSqm: 16800, priceChange: 6.3, rentNew: 168000, rentRenewed: 152000, grossYield: 5.0, netYield: 4.2, transactions: 2900, value: 7600000000, offPlan: 22, ready: 78 },
  { district: "Meydan", avgPricePerSqm: 15200, priceChange: 4.8, rentNew: 80000, rentRenewed: 70000, grossYield: 5.5, netYield: 4.6, transactions: 4800, value: 6500000000, offPlan: 68, ready: 32 },
];

const SUPPLY_DATA = [
  { district: "Dubai Marina", y2024: { planned: 2500, delivered: 2200 }, y2025: { planned: 3200, delivered: 1800 }, risk: "moderate" },
  { district: "Downtown Dubai", y2024: { planned: 1800, delivered: 1500 }, y2025: { planned: 2400, delivered: 1200 }, risk: "moderate" },
  { district: "Business Bay", y2024: { planned: 4500, delivered: 3800 }, y2025: { planned: 5200, delivered: 2800 }, risk: "high" },
  { district: "JVC (Jumeirah Village Circle)", y2024: { planned: 8000, delivered: 6500 }, y2025: { planned: 9500, delivered: 5000 }, risk: "high" },
  { district: "Palm Jumeirah", y2024: { planned: 800, delivered: 700 }, y2025: { planned: 1000, delivered: 500 }, risk: "low" },
  { district: "Dubai Hills Estate", y2024: { planned: 5000, delivered: 4200 }, y2025: { planned: 6000, delivered: 3500 }, risk: "moderate" },
  { district: "JBR (Jumeirah Beach Residence)", y2024: { planned: 200, delivered: 180 }, y2025: { planned: 100, delivered: 80 }, risk: "low" },
  { district: "Creek Harbour", y2024: { planned: 3500, delivered: 2800 }, y2025: { planned: 4500, delivered: 2200 }, risk: "moderate" },
  { district: "DIFC", y2024: { planned: 600, delivered: 500 }, y2025: { planned: 800, delivered: 400 }, risk: "low" },
  { district: "Dubai South", y2024: { planned: 6000, delivered: 4200 }, y2025: { planned: 8000, delivered: 3500 }, risk: "high" },
  { district: "Jumeirah Lake Towers (JLT)", y2024: { planned: 1200, delivered: 1000 }, y2025: { planned: 1500, delivered: 800 }, risk: "low" },
  { district: "Al Furjan", y2024: { planned: 3000, delivered: 2500 }, y2025: { planned: 3500, delivered: 2000 }, risk: "moderate" },
  { district: "Damac Hills", y2024: { planned: 5500, delivered: 4000 }, y2025: { planned: 7000, delivered: 3200 }, risk: "high" },
  { district: "Arabian Ranches", y2024: { planned: 1500, delivered: 1200 }, y2025: { planned: 1800, delivered: 1000 }, risk: "low" },
  { district: "Meydan", y2024: { planned: 6500, delivered: 4500 }, y2025: { planned: 8500, delivered: 3800 }, risk: "high" },
];

export async function seedDatabase() {
  try {
    const existingDistricts = await db.select().from(districts);
    if (existingDistricts.length > 0) {
      console.log("Database already seeded, skipping...");
      return;
    }
  } catch (err: any) {
    if (err.code === '42P01') {
      console.log("Tables don't exist yet, seed will retry on next start or after migration.");
      return;
    }
    throw err;
  }

  console.log("Seeding database...");

  const insertedDistricts = await db.insert(districts).values(DISTRICTS_DATA).returning();
  console.log(`Inserted ${insertedDistricts.length} districts`);

  const districtMap = new Map<string, number>();
  insertedDistricts.forEach((d) => districtMap.set(d.name, d.id));

  const stats2024 = MARKET_STATS_2024.map((s) => ({
    districtId: districtMap.get(s.district)!,
    year: 2024,
    quarter: "annual",
    avgPricePerSqm: s.avgPricePerSqm,
    priceChangePercent: s.priceChange,
    avgRentNew: s.rentNew,
    avgRentRenewed: s.rentRenewed,
    grossYield: s.grossYield,
    netYield: s.netYield,
    transactionVolume: s.transactions,
    transactionValue: s.value,
    offPlanShare: s.offPlan,
    readyShare: s.ready,
  }));

  const stats2025 = MARKET_STATS_2025.map((s) => ({
    districtId: districtMap.get(s.district)!,
    year: 2025,
    quarter: "annual",
    avgPricePerSqm: s.avgPricePerSqm,
    priceChangePercent: s.priceChange,
    avgRentNew: s.rentNew,
    avgRentRenewed: s.rentRenewed,
    grossYield: s.grossYield,
    netYield: s.netYield,
    transactionVolume: s.transactions,
    transactionValue: s.value,
    offPlanShare: s.offPlan,
    readyShare: s.ready,
  }));

  await db.insert(marketStats).values([...stats2024, ...stats2025]);
  console.log("Inserted market stats for 2024 and 2025");

  for (const s of SUPPLY_DATA) {
    const dId = districtMap.get(s.district);
    if (!dId) continue;
    await db.insert(supplyPipeline).values([
      { districtId: dId, year: 2024, unitsPlanned: s.y2024.planned, unitsDelivered: s.y2024.delivered, supplyRiskLevel: s.risk },
      { districtId: dId, year: 2025, unitsPlanned: s.y2025.planned, unitsDelivered: s.y2025.delivered, supplyRiskLevel: s.risk },
    ]);
  }
  console.log("Inserted supply pipeline data");

  for (const s of MARKET_STATS_2025) {
    const dId = districtMap.get(s.district);
    if (!dId) continue;

    const yieldScore = Math.min(10, (s.grossYield / 8) * 10);
    const growthScore = Math.min(10, (s.priceChange / 15) * 10);
    const supplyData = SUPPLY_DATA.find((sd) => sd.district === s.district);
    const supplyRisk = supplyData?.risk === "high" ? 3 : supplyData?.risk === "moderate" ? 6 : 9;
    const attractiveness = parseFloat(((yieldScore * 0.35 + growthScore * 0.35 + supplyRisk * 0.3)).toFixed(1));

    let recommendation = "Observation";
    let investorProfile = "Tous profils";
    if (attractiveness >= 7) {
      recommendation = "Achat recommandé";
      investorProfile = s.grossYield >= 7 ? "Buy-to-Let" : "Capital Growth";
    } else if (attractiveness >= 5.5) {
      recommendation = "Opportunité sélective";
      investorProfile = "Investisseur expérimenté";
    } else if (attractiveness < 4.5) {
      recommendation = "Prudence - risque supply";
      investorProfile = "Long terme uniquement";
    }

    await db.insert(investmentOpportunities).values({
      districtId: dId,
      year: 2025,
      attractivenessScore: attractiveness,
      yieldScore,
      capitalGrowthScore: growthScore,
      supplyRiskScore: supplyRisk,
      recommendation,
      investorProfile,
    });
  }
  console.log("Inserted investment opportunities");
  console.log("Database seeding complete!");
}
