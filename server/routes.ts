import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { seedDatabase } from "./seed";

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure tables exist before seeding
  try {
    await seedDatabase();
  } catch (err) {
    console.error("Failed to seed database:", err);
  }

  app.get("/api/stats/global", async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const stats = await storage.getGlobalStats(year);
      res.json(stats);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch global stats" });
    }
  });

  app.get("/api/districts", async (req, res) => {
    try {
      const districtList = await storage.getDistricts();
      res.json(districtList);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch districts" });
    }
  });

  app.get("/api/districts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const district = await storage.getDistrict(id);
      if (!district) return res.status(404).json({ error: "District not found" });

      const stats = await storage.getDistrictStats(id);
      const supply = await storage.getSupplyPipeline(id);
      res.json({ district, stats, supply });
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch district" });
    }
  });

  app.get("/api/market-stats", async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const stats = await storage.getAllMarketStats(year);
      res.json(stats);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch market stats" });
    }
  });

  app.get("/api/districts/:id/stats", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const stats = await storage.getDistrictStats(id, year);
      res.json(stats);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch district stats" });
    }
  });

  app.get("/api/opportunities", async (req, res) => {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const opportunities = await storage.getOpportunities(year);
      res.json(opportunities);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch opportunities" });
    }
  });

  app.get("/api/favorites/:sessionId", async (req, res) => {
    try {
      const favs = await storage.getFavorites(req.params.sessionId);
      res.json(favs);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req, res) => {
    try {
      const { sessionId, districtId } = req.body;
      if (!sessionId || !districtId) return res.status(400).json({ error: "Missing sessionId or districtId" });
      const fav = await storage.addFavorite(sessionId, districtId);
      res.json(fav);
    } catch (e) {
      res.status(500).json({ error: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites", async (req, res) => {
    try {
      const { sessionId, districtId } = req.body;
      if (!sessionId || !districtId) return res.status(400).json({ error: "Missing sessionId or districtId" });
      await storage.removeFavorite(sessionId, districtId);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to remove favorite" });
    }
  });

  app.get("/api/simulations/:sessionId", async (req, res) => {
    try {
      const sims = await storage.getSimulations(req.params.sessionId);
      res.json(sims);
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch simulations" });
    }
  });

  app.post("/api/simulations", async (req, res) => {
    try {
      const { sessionId, name, districtName, inputs, results } = req.body;
      if (!sessionId || !name || !inputs || !results) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const sim = await storage.saveSimulation(sessionId, { name, districtName, inputs, results });
      res.json(sim);
    } catch (e) {
      res.status(500).json({ error: "Failed to save simulation" });
    }
  });

  app.delete("/api/simulations/:id", async (req, res) => {
    try {
      await storage.deleteSimulation(parseInt(req.params.id));
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: "Failed to delete simulation" });
    }
  });

  app.get("/api/market/trends", async (req, res) => {
    try {
      const districtId = req.query.district_id ? parseInt(req.query.district_id as string) : undefined;
      const range = req.query.range as string; // '3M', '6M', '1Y', '3Y', 'All'
      
      if (!districtId) return res.status(400).json({ error: "Missing district_id" });
      
      const stats = await storage.getDistrictStats(districtId);
      let filteredStats = stats;
      
      const now = new Date();
      const currentYear = now.getFullYear();
      
      if (range === '3M' || range === '6M') {
        // Since our data is quarterly/yearly, 3M/6M are approximate
        filteredStats = stats.slice(0, range === '3M' ? 1 : 2);
      } else if (range === '1Y') {
        filteredStats = stats.filter(s => s.year >= currentYear - 1);
      } else if (range === '3Y') {
        filteredStats = stats.filter(s => s.year >= currentYear - 3);
      }
      
      res.json(filteredStats.reverse()); // Chronological order for charts
    } catch (e) {
      res.status(500).json({ error: "Failed to fetch market trends" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
