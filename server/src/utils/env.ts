import dotenv from 'dotenv'

dotenv.config();

const env = {
    PORT: process.env.PORT || "9000",
    NODE_ENV: process.env.NODE_ENV || "development",
    DATABASE_URL: process.env.DATABASE_URL || "mongodb://localhost:27017/devpilot",
    JWT_SECRET: process.env.JWT_SECRET || "ahmedG3far44_ahmedG3far44_ahmedG3far44",
    EC2_HOST: process.env.EC2_HOST || "72.62.236.106",
    EC2_USER: process.env.EC2_USER || "devpilot",
    EC2_SSH_PORT: process.env.EC2_SSH_PORT || "2",
    EC2_SSH_PASSWORD: process.env.EC2_SSH_PASSWORD || "442002",
    DOMAIN: process.env.DOMAIN || "stacktest.space",
    DEPLOY_SCRIPT_PATH: process.env.DEPLOY_SCRIPT_PATH || "/home/devpilot/scripts/",
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || "Ov23liyzHb8orB5dKL33",
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || "bb7ddb38a12cae0ddb74f387da1364126b68838e",
    CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN || "http://localhost:3000"
}


export default env;