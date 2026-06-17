import request from 'supertest';
import { app } from '../../server.js';

export const api = () => request(app);

export const authHeader = (token) => ({
    Authorization: `Bearer ${token}`
});
