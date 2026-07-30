import dotenv from "dotenv";

dotenv.config();

const env = {
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL:
    process.env.DATABASE_URL || "mongodb://localhost:27017/devpilot",
  JWT_SECRET: process.env.JWT_SECRET,
  EC2_HOST_IP: process.env.EC2_HOST_IP || process.env.EC2_HOST,
  EC2_USER: process.env.EC2_USER,
  EC2_SSH_PORT: process.env.EC2_SSH_PORT,
  EC2_SSH_KEY: process.env.EC2_SSH_KEY,
  DOMAIN: process.env.DOMAIN,
  CF_ZONE_ID: process.env.CF_ZONE_ID || "",
  CF_API_TOKEN: process.env.CF_API_TOKEN || "",
  EMAIL: process.env.EMAIL,
  DEPLOY_SCRIPT_PATH: process.env.DEPLOY_SCRIPT_PATH,
  AUTH_GITHUB_CLIENT_ID: process.env.AUTH_GITHUB_CLIENT_ID || "",
  AUTH_GITHUB_CLIENT_SECRET: process.env.AUTH_GITHUB_CLIENT_SECRET || "",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || "",
};

export default env;
