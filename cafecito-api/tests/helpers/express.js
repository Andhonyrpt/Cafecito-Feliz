import { jest } from '@jest/globals';

export const makeReq = (overrides = {}) => ({
    headers: {},
    body: {},
    params: {},
    query: {},
    ...overrides
});

export const makeRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    res.send = jest.fn(() => res);
    return res;
};

export const makeNext = () => jest.fn();
