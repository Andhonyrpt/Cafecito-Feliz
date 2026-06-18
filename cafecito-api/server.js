import express from 'express';
import mongoose from 'mongoose';
import dbConnection from './src/config/database.js';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import errorHandler from './src/middlewares/errorHandler.js';
import setupGlobalErrorHandlers from "./src/middlewares/globalerrorHandler.js";
import routes from './src/routes/index.js';

dotenv.config();

setupGlobalErrorHandlers();

export const app = express();

dbConnection();

app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',')
}));

app.use(helmet());
app.use(express.json({ limit: '100kb' }));

// Health check endpoint
app.get("/health", async (req, res) => {
    const healthcheck = {
        uptime: process.uptime(),
        status: "OK",
        timestamp: Date.now(),
        database: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    };
    try {
        res.status(200).json(healthcheck);
    } catch (error) {
        healthcheck.status = "ERROR";
        res.status(503).json(healthcheck);
    }
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: "E-commerce API",
        version: "1.0.0",
        endpoints: {
            health: "/health",
            api: "/api"
        }
    });
});

app.use('/api', routes);

app.use((req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        method: req.method,
        url: req.originalUrl
    });
});

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
}
