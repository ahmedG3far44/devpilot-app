import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import indexRouter from "./routes/index.route";

import express from "express";

import { errorHandler } from "./middlewares/errorHandler";
import { connectDatabase } from "./config/db";
import env from "./config/env";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGINS = env.CLIENT_URL
  ? env.CLIENT_URL.split(",").map((s) => s.trim())
  : [];

app.use(cookieParser());

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["POST", "GET", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    name: "DevPilot API",
    message:
      "Welcome to the DevPilot API. Please refer to the documentation for available endpoints.",
    availableEndpoints: "success",
    client: env.CLIENT_URL,
  });
});

app.use("/api", indexRouter);

app.use(errorHandler);

const start = async () => {
  try {
    await connectDatabase();

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

export default app;
