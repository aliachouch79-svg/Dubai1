import fs from 'fs';
import path from 'path';
import { db } from '../../db';
import { districts, marketStats, supplyPipeline, investmentOpportunities } from '../../../shared/schema';
import { eq, and } from 'drizzle-orm';
import { validateDataConsistency } from '../../lib/calculations/market-metrics';

/**
 * Data Import Script
 * Handles CSV/JSON ingestion with validation and idempotence
 */

async function importData(filePath: string) {
  console.log(`Starting import from ${filePath}...`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(content);
  
  const results = {
    success: 0,
    errors: 0,
    skipped: 0
  };

  for (const item of data) {
    try {
      // 1. Ensure District exists
      let [district] = await db.select().from(districts).where(eq(districts.name, item.districtName));
      
      if (!district) {
        console.log(`Creating new district: ${item.districtName}`);
        [district] = await db.insert(districts).values({
          name: item.districtName,
          category: item.category || 'Residential',
          marketStatus: item.marketStatus || 'Stable',
          statusLabel: item.statusLabel || 'Stable'
        }).returning();
      }

      // 2. Validate consistency
      const validationErrors = validateDataConsistency(item);
      if (validationErrors.length > 0) {
        console.warn(`Validation warnings for ${item.districtName} (${item.year}):`, validationErrors);
      }

      // 3. Import Market Stats (Idempotent by district + year + quarter)
      const existingStat = await db.select().from(marketStats).where(
        and(
          eq(marketStats.districtId, district.id),
          eq(marketStats.year, item.year),
          eq(marketStats.quarter, item.quarter || 'Q4')
        )
      );

      if (existingStat.length === 0) {
        const insertValue: any = {
          districtId: district.id,
          year: item.year,
          quarter: item.quarter || 'Q4',
          avgPricePerSqm: item.avgPricePerSqm,
          priceChangePercent: item.priceChangePercent,
          avgRentNew: item.avgRentNew,
          grossYield: item.grossYield,
          transactionVolume: item.transactionVolume,
          transactionValue: item.transactionValue,
          source: item.source || 'Dubai Land Department',
          importedAt: new Date()
        };
        await db.insert(marketStats).values(insertValue);
        results.success++;
      } else {
        results.skipped++;
      }

    } catch (error) {
      console.error(`Error importing item:`, item, error);
      results.errors++;
    }
  }

  console.log(`Import complete: ${results.success} success, ${results.skipped} skipped, ${results.errors} errors`);
}

// Example usage: node server/scripts/data-import/import.js data.json
const targetFile = process.argv[2];
if (targetFile) {
  importData(path.resolve(process.cwd(), targetFile))
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

export { importData };
