import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {

    const dateTime = new Date();
    const logFilePath = path.join(__dirname, "../../logs/error.log");
    const logMessage = `${new Date().toISOString()}
    -${req.method}
    -${req.url}
    -${err.message}
    -${err.stack}\n`;

    // Crear directorio si no existe
    const logDir = path.dirname(logFilePath);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    fs.appendFile(logFilePath, logMessage, (fsErr) => {
        if (fsErr) {
            console.error('Failed to write into log file', fsErr);
        }
    });

    if (!res.headersSent) {
        const statusCode = err.statusCode || err.status || 500;
        res.status(statusCode).json({
            status: statusCode >= 500 ? 'error' : 'fail',
            message: statusCode >= 500 ? 'Internal Server Error' : err.message
        });
    }

};

export default errorHandler;