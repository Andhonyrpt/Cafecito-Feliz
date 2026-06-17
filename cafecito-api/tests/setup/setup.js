import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import dotenv from 'dotenv';

dotenv.config();

jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
});

afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
    }
});
