import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupGlobalErrorHandlers = () => {

    const logFilePath = path.join(__dirname, '../../logs/error.log');

    // Crear directorio si no existe
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    process.on('uncaughtException', (error) => {
        const dateTime = new Date();
        const logMessage = `${dateTime.toISOString()} | UNCAUGHT EXCEPTION | ${error.message} | ${error.stack}\n`
        fs.appendFileSync(logFilePath, logMessage);
        console.log('Uncaught exception server continues...');
    });

    process.on('unhandledRejection', (reason, promise) => {
        const dateTime = new Date();
        const logMessage = `${dateTime.toISOString()} | UNHANDLED EXCEPTION | ${reason} | ${promise}\n`
        fs.appendFileSync(logFilePath, logMessage);
        console.log('Uncaught rejection logged, server continues...');
    });
};

export default  setupGlobalErrorHandlers;