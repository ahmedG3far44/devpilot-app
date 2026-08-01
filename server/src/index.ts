import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import env from "./config/env";
import cookieParser from "cookie-parser";
import indexRouter from "./routes/index.route";

import { errorHandler } from "./middlewares/errorHandler";
import { connectDatabase } from "./config/db";

dotenv.config();

const app = express();

app.set("trust proxy", 1);

const PORT = env.PORT || 5000;
const ALLOWED_ORIGINS = env.CLIENT_URL;

app.use(cookieParser());

app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["POST", "GET", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).send(
    `
    <h1>DevPilot API</h1>
    <h2>Timestamp: ${new Date().toISOString()}</h2>
    <p>Welcome to the DevPilot API. Please refer to the documentation for available endpoints.</p>
    <p>Client: ${env.CLIENT_URL}</p>
    <p>Environment: ${env.NODE_ENV}</p>
  `,
  );
});

app.use("/api", indexRouter);

app.use(errorHandler);

const start = async () => {
  try {
    await connectDatabase();

    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

start();

export default app;
