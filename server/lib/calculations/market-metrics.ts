import { MarketStat, District } from "@shared/schema";

/**
 * Calculations for Dubai Invest Market Data
 * Indicators are calculated dynamically to ensure consistency
 */

export interface MarketMetrics {
  grossYield: number | null;
  capitalGrowth: number | null;
  pricePerSqm: number | null;
  roi5Year: number | null;
}

export function calculateMarketMetrics(stats: MarketStat[]): MarketMetrics {
  if (!stats || stats.length === 0) {
    return { grossYield: null, capitalGrowth: null, pricePerSqm: null, roi5Year: null };
  }

  // Sort by year and quarter to get latest
  const sortedStats = [...stats].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    const qA = a.quarter ? parseInt(a.quarter.replace("Q", "")) : 0;
    const qB = b.quarter ? parseInt(b.quarter.replace("Q", "")) : 0;
    return qB - qA;
  });

  const latest = sortedStats[0];
  
  // Gross Yield Calculation: (Annual Rent / Property Price) * 100
  // In our schema, we might have pre-calculated grossYield, but we verify here
  let grossYield = latest.grossYield;
  if (!grossYield && latest.avgRentNew && latest.avgPricePerSqm) {
    // Basic calculation if missing: Rent / Price
    // Assuming Rent is annual. If monthly, multiply by 12.
    // DLD/Talmo reports usually give annual rent.
    grossYield = (latest.avgRentNew / latest.avgPricePerSqm) * 100;
  }

  // Capital Growth: Percent change from previous period or year-over-year
  const capitalGrowth = latest.priceChangePercent;

  // ROI 5-Year Projection (Simplified)
  // ROI = ((Annual Rent * 5) + (Price * (1 + Growth)^5) - Price) / Price
  let roi5Year = null;
  if (latest.avgPricePerSqm && grossYield && capitalGrowth !== null) {
    const annualYieldDec = grossYield / 100;
    const annualGrowthDec = (capitalGrowth || 0) / 100;
    
    // Total Return = Rent Returns + Capital Appreciation
    const rentReturn = annualYieldDec * 5;
    const appreciation = Math.pow(1 + annualGrowthDec, 5) - 1;
    roi5Year = (rentReturn + appreciation) * 100;
  }

  return {
    grossYield: grossYield ? parseFloat(grossYield.toFixed(2)) : null,
    capitalGrowth: capitalGrowth ? parseFloat(capitalGrowth.toFixed(2)) : null,
    pricePerSqm: latest.avgPricePerSqm,
    roi5Year: roi5Year ? parseFloat(roi5Year.toFixed(2)) : null,
  };
}

export function validateDataConsistency(data: any): string[] {
  const errors: string[] = [];
  
  if (data.avgPricePerSqm && data.avgPricePerSqm < 0) errors.push("Price per SQM cannot be negative");
  if (data.grossYield && (data.grossYield < 0 || data.grossYield > 30)) {
    errors.push(`Suspicious Gross Yield: ${data.grossYield}%`);
  }
  if (data.priceChangePercent && (data.priceChangePercent > 100 || data.priceChangePercent < -50)) {
    errors.push(`Suspicious Price Change: ${data.priceChangePercent}%`);
  }
  
  return errors;
}
