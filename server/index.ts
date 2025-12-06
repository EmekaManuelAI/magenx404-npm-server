import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { authMiddleware } from "./middleware/auth";
import { blacklistRoute } from "./routes/blacklist";
import { ageRoute } from "./routes/age";
import { activityRoute } from "./routes/activity";
import { timelockRoute } from "./routes/timelock";
import { multitokenRoute } from "./routes/multitoken";
import { tierRoute } from "./routes/tier";
import { nodebtRoute } from "./routes/nodebt";

dotenv.config();

const app: Express = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(
  cors({
    exposedHeaders: ["X-404-Nonce", "X-404-Mechanism"],
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "x404-auth-server" });
});

// x404 Auth endpoints
app.get("/x404_auth/blacklist", authMiddleware, blacklistRoute);
app.get("/x404_auth/age", authMiddleware, ageRoute);
app.get("/x404_auth/activity", authMiddleware, activityRoute);
app.get("/x404_auth/timelock", authMiddleware, timelockRoute);
app.get("/x404_auth/multitoken", authMiddleware, multitokenRoute);
app.get("/x404_auth/tier", authMiddleware, tierRoute);
app.get("/x404_auth/nodebt", authMiddleware, nodebtRoute);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 x404 Auth Server running on port ${PORT}`);
  console.log(`📍 Endpoints available at http://localhost:${PORT}/x404_auth/*`);
});
