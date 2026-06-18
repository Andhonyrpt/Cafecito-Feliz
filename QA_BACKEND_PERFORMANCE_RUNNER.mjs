import { performance } from 'node:perf_hooks';

const cfg = {
  baseUrl: process.env.PERF_BASE_URL || 'http://localhost:3000',
  scenario: (process.env.PERF_SCENARIO || 'smoke').toLowerCase(),
  concurrency: Number(process.env.PERF_CONCURRENCY || 8),
  durationMs: Number(process.env.PERF_DURATION_MS || 10 * 60 * 1000),
  requestTimeoutMs: Number(process.env.PERF_REQUEST_TIMEOUT_MS || 1000),
  thinkTimeMs: Number(process.env.PERF_THINK_TIME_MS || 0),
  burstActiveMs: Number(process.env.PERF_BURST_ACTIVE_MS || 30 * 1000),
  burstIdleMs: Number(process.env.PERF_BURST_IDLE_MS || 30 * 1000),
  initialCash: Number(process.env.PERF_INITIAL_CASH || 100),
  discount: Number(process.env.PERF_DISCOUNT || 0),
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

async function request(path, { method = 'GET', headers = {}, body, timeoutMs = cfg.requestTimeoutMs } = {}) {
  const url = new URL(path, cfg.baseUrl).toString();
  const controller = new AbortController();
  const started = performance.now();
  const startedAt = Date.now();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        ...headers,
      },
      body,
      signal: controller.signal,
    });

    const text = await response.text();
    const durationMs = performance.now() - started;

    return {
      ok: response.ok,
      status: response.status,
      durationMs,
      startedAt,
      endedAt: Date.now(),
      body: parseJson(text),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      durationMs: performance.now() - started,
      startedAt,
      endedAt: Date.now(),
      error: error?.name === 'AbortError' ? 'timeout' : error?.message || 'request_failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

async function getAuthContext() {
  const accessToken = process.env.PERF_ACCESS_TOKEN;
  const refreshToken = process.env.PERF_REFRESH_TOKEN;

  if (accessToken || refreshToken) {
    return { accessToken, refreshToken };
  }

  const employeeId = process.env.PERF_EMPLOYEE_ID;
  const password = process.env.PERF_PASSWORD;

  if (employeeId && password) {
    const login = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, password }),
    });

    if (!login.ok || !login.body?.token) {
      throw new Error(`Login failed with status ${login.status}`);
    }

    return {
      accessToken: login.body.token,
      refreshToken: login.body.refreshToken,
      employeeId,
      password,
    };
  }

  const bootstrapId = `EMP-${Date.now().toString().slice(-6)}`;
  const bootstrapPassword = '12345';
  const bootstrapName = `Perf User ${Date.now().toString().slice(-6)}`;

  const register = await request('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      displayName: bootstrapName,
      employeeId: bootstrapId,
      password: bootstrapPassword,
      avatar: `http://example.com/${bootstrapId}.jpg`,
    }),
  });

  if (!register.ok) {
    throw new Error(`Bootstrap registration failed with status ${register.status}`);
  }

  const login = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId: bootstrapId, password: bootstrapPassword }),
  });

  if (!login.ok || !login.body?.token) {
    throw new Error(`Bootstrap login failed with status ${login.status}`);
  }

  return {
    accessToken: login.body.token,
    refreshToken: login.body.refreshToken,
    employeeId: bootstrapId,
    password: bootstrapPassword,
  };
}

function buildMixedTasks(auth, { includeAuth = false } = {}) {
  const productId = process.env.PERF_PRODUCT_ID;
  const clientId = process.env.PERF_CLIENT_ID;

  const tasks = [
    {
      name: 'health',
      weight: 8,
      run: () => request('/health'),
    },
    {
      name: 'root',
      weight: 4,
      run: () => request('/'),
    },
    {
      name: 'products',
      weight: 20,
      run: () => request('/api/products'),
    },
    {
      name: 'categories',
      weight: 15,
      run: () => request('/api/categories'),
    },
    {
      name: 'login',
      weight: includeAuth && auth?.accessToken ? 8 : 0,
      run: () => request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: auth.employeeId,
          password: auth.password,
        }),
      }),
    },
    {
      name: 'refresh',
      weight: includeAuth && auth?.refreshToken ? 6 : 0,
      run: () => request('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: auth.refreshToken }),
      }),
    },
    {
      name: 'clients-search',
      weight: auth?.accessToken ? 8 : 0,
      run: () => request('/api/clients/search?search=perf', {
        headers: authHeaders(auth.accessToken),
      }),
    },
    {
      name: 'orders-list',
      weight: auth?.accessToken ? 8 : 0,
      run: () => request('/api/orders', {
        headers: authHeaders(auth.accessToken),
      }),
    },
    {
      name: 'orders-preview',
      weight: auth?.accessToken && productId && clientId ? 13 : 0,
      run: () => request('/api/orders/preview', {
        method: 'POST',
        headers: {
          ...authHeaders(auth.accessToken),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client: clientId,
          products: [{ productId, quantity: 1 }],
          discount: cfg.discount,
        }),
      }),
    },
  ].filter((task) => task.weight > 0);

  if (!tasks.length) {
    throw new Error('No runnable tasks were configured. Check PERF env vars.');
  }

  return tasks;
}

async function runMixedScenario(auth, durationMs, concurrency, burst = false) {
  const tasks = buildMixedTasks(auth, { includeAuth: cfg.scenario === 'auth' || cfg.scenario === 'flow-smoke' });
  const endAt = Date.now() + durationMs;
  const records = [];
  const counts = { total: 0, ok: 0, failed: 0, timeouts: 0 };

  async function worker(workerId) {
    while (Date.now() < endAt) {
      if (burst) {
        const elapsed = durationMs - (endAt - Date.now());
        const cycle = cfg.burstActiveMs + cfg.burstIdleMs;
        const inActiveWindow = elapsed % cycle < cfg.burstActiveMs;
        if (!inActiveWindow) {
          await sleep(100);
          continue;
        }
      }

      const task = pickWeighted(tasks);
      const result = await task.run();

      counts.total += 1;
      if (result.ok) counts.ok += 1;
      else counts.failed += 1;
      if (result.error === 'timeout') counts.timeouts += 1;

      records.push({
        workerId,
        task: task.name,
        status: result.status,
        durationMs: result.durationMs,
        ok: result.ok,
        error: result.error || null,
        startedAt: result.startedAt,
        endedAt: result.endedAt,
      });

      if (cfg.thinkTimeMs > 0) {
        await sleep(cfg.thinkTimeMs);
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index + 1)));
  return { records, counts };
}

async function runFlowSmoke(auth) {
  const productId = process.env.PERF_PRODUCT_ID;
  const clientId = process.env.PERF_CLIENT_ID;
  const pin = process.env.PERF_CASH_PIN;

  if (!auth?.accessToken || !pin) {
    throw new Error('Flow smoke needs an authenticated user and PERF_CASH_PIN.');
  }

  const flowContext = await bootstrapFlowContext(auth, { productId, clientId });
  const results = [];

  results.push({ step: 'open-cash', ...(await request('/api/total-cash/open', {
    method: 'POST',
    headers: {
      ...authHeaders(auth.accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initialCash: cfg.initialCash }),
  })) });

  results.push({ step: 'preview', ...(await request('/api/orders/preview', {
    method: 'POST',
    headers: {
      ...authHeaders(auth.accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client: flowContext.clientId,
      products: [{ productId: flowContext.productId, quantity: 1 }],
      discount: cfg.discount,
    }),
  })) });

  results.push({ step: 'create-order', ...(await request('/api/orders', {
    method: 'POST',
    headers: {
      ...authHeaders(auth.accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client: flowContext.clientId,
      products: [{ productId: flowContext.productId, quantity: 1 }],
      paymentMethod: 'efectivo',
      orderType: 'local',
    }),
  })) });

  results.push({ step: 'close-cash', ...(await request('/api/total-cash/close', {
    method: 'POST',
    headers: {
      ...authHeaders(auth.accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pin, isCashCorrect: true }),
  })) });

  return results;
}

async function bootstrapFlowContext(auth, { productId, clientId } = {}) {
  let resolvedProductId = productId;
  let resolvedClientId = clientId;

  if (!resolvedProductId) {
    const products = await request('/api/products');
    const firstProduct = Array.isArray(products.body?.products) ? products.body.products[0] : null;

    if (!products.ok || !firstProduct?._id) {
      throw new Error('Unable to bootstrap product for flow smoke.');
    }

    resolvedProductId = firstProduct._id;
  }

  if (!resolvedClientId) {
    const clientSeed = `perf-${Date.now().toString().slice(-6)}@example.com`;
    const createdClient = await request('/api/clients', {
      method: 'POST',
      headers: {
        ...authHeaders(auth.accessToken),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        displayName: `Perf Client ${Date.now().toString().slice(-6)}`,
        email: clientSeed,
      }),
    });

    const clientIdFromResponse = createdClient.body?.client?._id;

    if (!createdClient.ok || !clientIdFromResponse) {
      throw new Error('Unable to bootstrap client for flow smoke.');
    }

    resolvedClientId = clientIdFromResponse;
  }

  return { productId: resolvedProductId, clientId: resolvedClientId };
}

function summarize(records) {
  const durations = records.map((item) => item.durationMs).filter((value) => Number.isFinite(value));
  const total = records.length;
  const failed = records.filter((item) => !item.ok).length;
  const timeouts = records.filter((item) => item.error === 'timeout').length;
  const start = records.length ? Math.min(...records.map((item) => item.startedAt || 0)) : 0;
  const end = records.length ? Math.max(...records.map((item) => item.endedAt || 0)) : 0;
  const elapsedSeconds = start && end ? Math.max((end - start) / 1000, 0.001) : 0.001;

  return {
    total,
    ok: total - failed,
    failed,
    timeouts,
    throughput: Number((total / elapsedSeconds).toFixed(2)),
    p50: Number(percentile(durations, 50).toFixed(2)),
    p90: Number(percentile(durations, 90).toFixed(2)),
    p95: Number(percentile(durations, 95).toFixed(2)),
    p99: Number(percentile(durations, 99).toFixed(2)),
    max: Number((durations.length ? Math.max(...durations) : 0).toFixed(2)),
    errorRate: total ? Number(((failed / total) * 100).toFixed(2)) : 0,
  };
}

function passFailSummary(summary, mode) {
  const underTarget = summary.p95 <= 1000 && summary.max <= 1000 && summary.errorRate <= 1;

  if (mode === 'stress') {
    return { pass: summary.total > 0, reason: 'Stress mode is informational and records the breaking point.' };
  }

  if (mode === 'flow-smoke') {
    return { pass: underTarget, reason: 'Flow smoke must satisfy the 1s target.' };
  }

  return { pass: underTarget, reason: 'Nominal modes must satisfy p95/max/error thresholds.' };
}

async function main() {
  const auth = await getAuthContext();
  const startedAt = Date.now();
  let rawResults = [];

  if (cfg.scenario === 'flow-smoke') {
    rawResults = await runFlowSmoke(auth);
  } else {
    const scenarioConfig = {
      smoke: { concurrency: 1, durationMs: 30_000, burst: false, thinkTimeMs: 500 },
      nominal: { concurrency: cfg.concurrency, durationMs: cfg.durationMs, burst: false, thinkTimeMs: 25 },
      auth: { concurrency: 1, durationMs: cfg.durationMs, burst: false, thinkTimeMs: 1000 },
      stress: { concurrency: Math.max(cfg.concurrency * 2, 16), durationMs: cfg.durationMs, burst: false },
      soak: { concurrency: cfg.concurrency, durationMs: cfg.durationMs, burst: false, thinkTimeMs: 100 },
      burst: { concurrency: cfg.concurrency, durationMs: cfg.durationMs, burst: true, thinkTimeMs: 0 },
    }[cfg.scenario];

    if (!scenarioConfig) {
      throw new Error(`Unknown scenario: ${cfg.scenario}`);
    }

    const previousThinkTime = cfg.thinkTimeMs;
    cfg.thinkTimeMs = scenarioConfig.thinkTimeMs ?? cfg.thinkTimeMs;
    const result = await runMixedScenario(auth, scenarioConfig.durationMs, scenarioConfig.concurrency, scenarioConfig.burst);
    cfg.thinkTimeMs = previousThinkTime;
    rawResults = result.records.map((item) => ({
      step: item.task,
      ok: item.ok,
      status: item.status,
      durationMs: item.durationMs,
      error: item.error,
      startedAt: item.startedAt,
      endedAt: item.endedAt,
    }));
  }

  const summary = summarize(rawResults);
  const verdict = passFailSummary(summary, cfg.scenario);

  const report = {
    scenario: cfg.scenario,
    baseUrl: cfg.baseUrl,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    summary,
    verdict,
    results: rawResults,
  };

  console.log(JSON.stringify(report, null, 2));

  if (!verdict.pass) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exitCode = 1;
});
