import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  real,
  timestamp,
  jsonb,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const districts = pgTable("districts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  nameAr: text("name_ar"),
  category: text("category").notNull(),
  description: text("description"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  dominantTypology: text("dominant_typology"),
  marketStatus: text("market_status").notNull(),
  statusLabel: text("status_label").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const marketStats = pgTable("market_stats", {
  id: serial("id").primaryKey(),
  districtId: integer("district_id").notNull().references(() => districts.id),
  year: integer("year").notNull(),
  quarter: text("quarter"),
  avgPricePerSqm: real("avg_price_per_sqm"),
  priceChangePercent: real("price_change_percent"),
  avgRentNew: real("avg_rent_new"),
  avgRentRenewed: real("avg_rent_renewed"),
  grossYield: real("gross_yield"),
  netYield: real("net_yield"),
  transactionVolume: integer("transaction_volume"),
  transactionValue: real("transaction_value"),
  avgPriceApartment: real("avg_price_apartment"),
  avgPriceVilla: real("avg_price_villa"),
  offPlanShare: real("off_plan_share"),
  readyShare: real("ready_share"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supplyPipeline = pgTable("supply_pipeline", {
  id: serial("id").primaryKey(),
  districtId: integer("district_id").notNull().references(() => districts.id),
  year: integer("year").notNull(),
  unitsPlanned: integer("units_planned"),
  unitsDelivered: integer("units_delivered"),
  majorProjects: jsonb("major_projects"),
  supplyRiskLevel: text("supply_risk_level"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const investmentOpportunities = pgTable("investment_opportunities", {
  id: serial("id").primaryKey(),
  districtId: integer("district_id").notNull().references(() => districts.id),
  year: integer("year").notNull(),
  attractivenessScore: real("attractiveness_score").notNull(),
  yieldScore: real("yield_score"),
  capitalGrowthScore: real("capital_growth_score"),
  supplyRiskScore: real("supply_risk_score"),
  recommendation: text("recommendation"),
  investorProfile: text("investor_profile"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  districtId: integer("district_id").references(() => districts.id),
  sessionId: text("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const simulations = pgTable("simulations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  sessionId: text("session_id"),
  name: text("name").notNull(),
  districtName: text("district_name"),
  inputs: jsonb("inputs").notNull(),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertDistrictSchema = createInsertSchema(districts).omit({
  id: true,
  createdAt: true,
});

export const insertMarketStatSchema = createInsertSchema(marketStats).omit({
  id: true,
  createdAt: true,
});

export const insertSupplyPipelineSchema = createInsertSchema(supplyPipeline).omit({
  id: true,
  createdAt: true,
});

export const insertOpportunitySchema = createInsertSchema(investmentOpportunities).omit({
  id: true,
  createdAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

export const insertSimulationSchema = createInsertSchema(simulations).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type District = typeof districts.$inferSelect;
export type MarketStat = typeof marketStats.$inferSelect;
export type SupplyPipeline = typeof supplyPipeline.$inferSelect;
export type InvestmentOpportunity = typeof investmentOpportunities.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Simulation = typeof simulations.$inferSelect;
