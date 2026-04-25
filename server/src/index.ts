import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from "cookie-parser";
import indexRouter from "./routes/index.route"

import express from 'express';

import { errorHandler } from './middlewares/errorHandler';
import { connectDatabase } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN;


app.use(cookieParser())

app.use(cors({
    origin: ALLOWED_ORIGIN ? ALLOWED_ORIGIN.split(",") : "*",
    methods: [
        "POST", "GET", "PUT", "DELETE"
    ],
    allowedHeaders: [
        "Content-Type", "Authorization"
    ],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', indexRouter);

app.use(errorHandler);

const start = async () => {
    try {
        await connectDatabase();

        app.listen(Number(PORT), "0.0.0.0", () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'
                }`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

start()


export default app;
