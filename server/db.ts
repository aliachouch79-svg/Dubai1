import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  console.warn("DATABASE_URL is not set, using local fallback if possible or skipping DB init");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || "",
  ssl: process.env.DATABASE_URL?.includes("render.com") || process.env.DATABASE_URL?.includes("supabase") ? {
    rejectUnauthorized: false
  } : false
});

export const db = drizzle(pool, { schema });

// Auto-migration/synchronization for development
const setupDb = async () => {
  try {
    const client = await pool.connect();
    try {
      // Create tables if they don't exist (minimal DDL)
      await client.query(`
        CREATE TABLE IF NOT EXISTS districts (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL,
          name_ar TEXT,
          description TEXT,
          latitude REAL,
          longitude REAL,
          dominant_typology TEXT,
          market_status TEXT NOT NULL,
          status_label TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS market_stats (
          id SERIAL PRIMARY KEY,
          district_id INTEGER NOT NULL REFERENCES districts(id),
          year INTEGER NOT NULL,
          quarter TEXT,
          avg_price_per_sqm REAL,
          price_change_percent REAL,
          avg_rent_new REAL,
          avg_rent_renewed REAL,
          gross_yield REAL,
          net_yield REAL,
          transaction_volume INTEGER,
          transaction_value REAL,
          avg_price_apartment REAL,
          avg_price_villa REAL,
          off_plan_share REAL,
          ready_share REAL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS supply_pipeline (
          id SERIAL PRIMARY KEY,
          district_id INTEGER NOT NULL REFERENCES districts(id),
          year INTEGER NOT NULL,
          units_planned INTEGER,
          units_delivered INTEGER,
          major_projects JSONB,
          supply_risk_level TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS investment_opportunities (
          id SERIAL PRIMARY KEY,
          district_id INTEGER NOT NULL REFERENCES districts(id),
          year INTEGER NOT NULL,
          attractiveness_score REAL NOT NULL,
          yield_score REAL,
          capital_growth_score REAL,
          supply_risk_score REAL,
          recommendation TEXT,
          investor_profile TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS favorites (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR REFERENCES users(id),
          district_id INTEGER REFERENCES districts(id),
          session_id TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        );
        CREATE TABLE IF NOT EXISTS simulations (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR REFERENCES users(id),
          session_id TEXT,
          name TEXT NOT NULL,
          district_name TEXT,
          inputs JSONB NOT NULL,
          results JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log("Database tables verified/created on Supabase");
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error setting up database tables on Supabase:", err);
  }
};

setupDb();
