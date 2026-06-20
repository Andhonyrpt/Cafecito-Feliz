import mongoose from 'mongoose';
import { api } from './http.js';
import { makeUserPayload } from './factories.js';

export const registerUser = async (overrides = {}) => {
    const payload = makeUserPayload(overrides);
    const response = await api().post('/api/auth/register').send(payload);

    return { payload, response };
};

export const loginUser = async ({ employeeId, password = '12345' }) => {
    const response = await api().post('/api/auth/login').send({ employeeId, password });

    return {
        response,
        token: response.body.token,
        refreshToken: response.body.refreshToken,
        user: response.body.user
    };
};

export const createUserWithToken = async (overrides = {}) => {
    const { payload, response: registerResponse } = await registerUser(overrides);
    const login = await loginUser({ employeeId: payload.employeeId, password: payload.password });

    return {
        payload,
        registerResponse,
        loginResponse: login.response,
        token: login.token,
        refreshToken: login.refreshToken,
        user: login.user
    };
};

export const createAdminWithToken = async (overrides = {}) => {
    const created = await createUserWithToken(overrides);
    const User = mongoose.model('User');
    await User.findOneAndUpdate({ employeeId: created.payload.employeeId }, { role: 'admin' });
    const login = await loginUser({ employeeId: created.payload.employeeId, password: created.payload.password });

    return {
        ...created,
        loginResponse: login.response,
        token: login.token,
        refreshToken: login.refreshToken,
        user: login.user
    };
};

export const createBaristaWithToken = async (overrides = {}) => {
    const created = await createUserWithToken(overrides);
    const User = mongoose.model('User');
    await User.findOneAndUpdate({ employeeId: created.payload.employeeId }, { role: 'barista' });
    const login = await loginUser({ employeeId: created.payload.employeeId, password: created.payload.password });

    return {
        ...created,
        loginResponse: login.response,
        token: login.token,
        refreshToken: login.refreshToken,
        user: login.user
    };
};
