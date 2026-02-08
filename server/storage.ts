import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  districts,
  marketStats,
  supplyPipeline,
  investmentOpportunities,
  favorites,
  simulations,
  users,
  type District,
  type MarketStat,
  type SupplyPipeline,
  type InvestmentOpportunity,
  type Favorite,
  type Simulation,
  type User,
  type InsertUser,
} from "@shared/schema";

export interface IStorage {
  getDistricts(): Promise<District[]>;
  getDistrict(id: number): Promise<District | undefined>;
  getDistrictStats(districtId: number, year?: number): Promise<MarketStat[]>;
  getAllMarketStats(year?: number): Promise<MarketStat[]>;
  getGlobalStats(year?: number): Promise<any>;
  getSupplyPipeline(districtId: number): Promise<SupplyPipeline[]>;
  getOpportunities(year?: number): Promise<(InvestmentOpportunity & { district: District })[]>;
  getFavorites(sessionId: string): Promise<(Favorite & { district: District | null })[]>;
  addFavorite(sessionId: string, districtId: number): Promise<Favorite>;
  removeFavorite(sessionId: string, districtId: number): Promise<void>;
  getSimulations(sessionId: string): Promise<Simulation[]>;
  saveSimulation(sessionId: string, data: { name: string; districtName?: string; inputs: any; results: any }): Promise<Simulation>;
  deleteSimulation(id: number): Promise<void>;
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  async getDistricts(): Promise<District[]> {
    return db.select().from(districts).orderBy(districts.name);
  }

  async getDistrict(id: number): Promise<District | undefined> {
    const [district] = await db.select().from(districts).where(eq(districts.id, id));
    return district;
  }

  async getDistrictStats(districtId: number, year?: number): Promise<MarketStat[]> {
    if (year) {
      return db.select().from(marketStats)
        .where(and(eq(marketStats.districtId, districtId), eq(marketStats.year, year)))
        .orderBy(marketStats.quarter);
    }
    return db.select().from(marketStats)
      .where(eq(marketStats.districtId, districtId))
      .orderBy(desc(marketStats.year), marketStats.quarter);
  }

  async getAllMarketStats(year?: number): Promise<MarketStat[]> {
    if (year) {
      return db.select().from(marketStats).where(eq(marketStats.year, year));
    }
    return db.select().from(marketStats).orderBy(desc(marketStats.year));
  }

  async getGlobalStats(year?: number): Promise<any> {
    const targetYear = year || 2025;
    const stats = await db.select().from(marketStats).where(eq(marketStats.year, targetYear));

    if (!stats || stats.length === 0) {
      // Fallback to latest available year if requested year has no data
      const latest = await db.select().from(marketStats).orderBy(desc(marketStats.year)).limit(1);
      if (latest.length > 0) {
        return this.getGlobalStats(latest[0].year);
      }
      return null;
    }

    const avgPricePerSqm = stats.reduce((s, r) => s + (r.avgPricePerSqm || 0), 0) / stats.length;
    const avgYield = stats.reduce((s, r) => s + (r.grossYield || 0), 0) / stats.length;
    const avgGrowth = stats.reduce((s, r) => s + (r.priceChangePercent || 0), 0) / stats.length;
    const totalTransactions = stats.reduce((s, r) => s + (r.transactionVolume || 0), 0);
    const totalValue = stats.reduce((s, r) => s + (r.transactionValue || 0), 0);

    return {
      year: targetYear,
      avgPricePerSqm: Math.round(avgPricePerSqm) || 0,
      avgYield: stats.length > 0 ? parseFloat(avgYield.toFixed(1)) : 0,
      avgGrowth: stats.length > 0 ? parseFloat(avgGrowth.toFixed(1)) : 0,
      totalTransactions: totalTransactions || 0,
      totalValueBillions: stats.length > 0 ? parseFloat((totalValue / 1000000000).toFixed(1)) : 0,
      districtCount: stats.length,
    };
  }

  async getSupplyPipeline(districtId: number): Promise<SupplyPipeline[]> {
    return db.select().from(supplyPipeline)
      .where(eq(supplyPipeline.districtId, districtId))
      .orderBy(supplyPipeline.year);
  }

  async getOpportunities(year?: number): Promise<(InvestmentOpportunity & { district: District })[]> {
    const targetYear = year || 2025;
    const results = await db
      .select({
        id: investmentOpportunities.id,
        districtId: investmentOpportunities.districtId,
        year: investmentOpportunities.year,
        attractivenessScore: investmentOpportunities.attractivenessScore,
        yieldScore: investmentOpportunities.yieldScore,
        capitalGrowthScore: investmentOpportunities.capitalGrowthScore,
        supplyRiskScore: investmentOpportunities.supplyRiskScore,
        recommendation: investmentOpportunities.recommendation,
        investorProfile: investmentOpportunities.investorProfile,
        createdAt: investmentOpportunities.createdAt,
        district: districts,
      })
      .from(investmentOpportunities)
      .innerJoin(districts, eq(investmentOpportunities.districtId, districts.id))
      .where(eq(investmentOpportunities.year, targetYear))
      .orderBy(desc(investmentOpportunities.attractivenessScore));

    return results;
  }

  async getFavorites(sessionId: string): Promise<(Favorite & { district: District | null })[]> {
    const results = await db
      .select({
        id: favorites.id,
        userId: favorites.userId,
        districtId: favorites.districtId,
        sessionId: favorites.sessionId,
        createdAt: favorites.createdAt,
        district: districts,
      })
      .from(favorites)
      .leftJoin(districts, eq(favorites.districtId, districts.id))
      .where(eq(favorites.sessionId, sessionId))
      .orderBy(desc(favorites.createdAt));

    return results;
  }

  async addFavorite(sessionId: string, districtId: number): Promise<Favorite> {
    const existing = await db.select().from(favorites)
      .where(and(eq(favorites.sessionId, sessionId), eq(favorites.districtId, districtId)));
    if (existing.length > 0) return existing[0];

    const [fav] = await db.insert(favorites).values({ sessionId, districtId }).returning();
    return fav;
  }

  async removeFavorite(sessionId: string, districtId: number): Promise<void> {
    await db.delete(favorites)
      .where(and(eq(favorites.sessionId, sessionId), eq(favorites.districtId, districtId)));
  }

  async getSimulations(sessionId: string): Promise<Simulation[]> {
    return db.select().from(simulations)
      .where(eq(simulations.sessionId, sessionId))
      .orderBy(desc(simulations.createdAt));
  }

  async saveSimulation(sessionId: string, data: { name: string; districtName?: string; inputs: any; results: any }): Promise<Simulation> {
    const [sim] = await db.insert(simulations).values({
      sessionId,
      name: data.name,
      districtName: data.districtName,
      inputs: data.inputs,
      results: data.results,
    }).returning();
    return sim;
  }

  async deleteSimulation(id: number): Promise<void> {
    await db.delete(simulations).where(eq(simulations.id, id));
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
}

export const storage = new DatabaseStorage();
