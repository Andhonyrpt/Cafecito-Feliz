# Repository Guide

## Package Boundaries
- This repository has two independent Node packages: `cafecito-api/` and `cafecito-app/`.
- This is not an npm workspace. Do not run package scripts from the repository root; run `npm` commands inside the package you are changing.
- Each package has its own `package-lock.json`. Install dependencies separately with `npm install` inside `cafecito-api/` or `cafecito-app/`.
- There are no root lint, test, build, typecheck, formatter, codegen, or CI workflow scripts in the repo.
- Do not modify `cafecito-api/AGENTS.md` or `cafecito-app/AGENTS.md` unless the user explicitly asks. They contain package-specific notes that should be preserved.
- If root guidance and package-level guidance disagree with executable config, trust the executable config first, then update only the requested instruction file.

## Commands
- API setup/dev commands are run from `cafecito-api/`: `npm install`, `npm run dev`, `npm start`.
- API E2E seed command is run from `cafecito-api/`: `npm run seed:e2e`; it only resets reserved `E2E` data such as `EMP-9001`, `EMP-9002`, `E2E Cafes`, `E2E Americano`, and `e2e.cliente@e2e.local`.
- API tests are Jest/Supertest/MongoMemoryReplSet and are run from `cafecito-api/`: `npm test`.
- API focused test example: `npm test -- tests/auth.test.js`.
- API watch and coverage commands: `npm run test:watch`, `npm run test:coverage`.
- Frontend setup/dev commands are run from `cafecito-app/`: `npm install`, `npm start`, `npm run build`.
- Frontend tests are Create React App/Jest and default to watch mode. Use `npm test -- --watchAll=false` for a non-watch run.
- Frontend focused test example: `npm test -- App.test.js --watchAll=false`.
- Cypress is configured in `cafecito-app` with `npm run cypress:open`, `npm run cypress:run`, and `npm run e2e`. Current E2E specs under `cypress/e2e/` mock API calls with `cy.intercept`; backend-real Cypress is separate under `cypress/e2e-real/` and runs with `npm run cypress:run:real` after `npm run seed:e2e` plus live API/frontend servers.

## API
- `cafecito-api` is an Express 5 + Mongoose REST API. `server.js` is the real entrypoint and `package.json` has `"type": "module"`.
- Order creation uses MongoDB transactions; local/deployed MongoDB must support transactions, such as by running as a replica set.
- Use ESM syntax in backend files: `import`/`export`, not `require()`/`module.exports`.
- Include `.js` on local backend imports, for example `import User from "../models/user.js";`.
- `server.js` calls `dotenv.config()`, exports `app`, mounts all API routes under `/api`, and only starts listening when `NODE_ENV !== "test"`.
- `server.js` also defines `/health` and `/` before the `/api` router, then a 404 handler, then the global `errorHandler`.
- API env keys are documented in `cafecito-api/.env.example`: `PORT`, `NODE_ENV`, `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `CORS_ORIGIN`.
- `src/config/database.js` builds the Mongo connection from `MONGODB_URI` plus `MONGODB_DB`. In tests it returns early when `NODE_ENV === "test"`.
- Jest setup in `tests/setup/setup.js` starts `mongodb-memory-server` and connects Mongoose to the in-memory URI, so API tests should not require a real MongoDB instance.
- `jest.config.js` matches `tests/**/*.test.js`, uses `tests/setup/setup.js`, disables transforms, maps local `.js` imports for ESM, sets a 60s timeout in setup, and has coverage thresholds.
- Keep backend business logic in controllers. The backend does not currently use a service-layer pattern for business logic.
- Route files should follow the existing middleware sequence: auth middleware when needed, admin/role middleware when needed, validators from `src/middlewares/validators.js`, `validate`, then the controller.
- Admin routes use `authMiddleware` before `isAdmin`; do not reverse that order.
- Controllers should wrap async work in `try/catch` and pass unexpected errors to `next(error)` so `src/middlewares/errorHandler.js` handles logging/response formatting.
- Do not add manual `res.status(500).json(...)` responses inside controller catches unless there is a deliberate, route-specific reason.
- New Mongoose schemas should keep the repo pattern of `{ timestamps: true }`.
- API routes are composed in `src/routes/index.js`: `/auth` is mounted with a prefix, while user/category/product/client/order/cash routers define their own paths internally.

## Frontend
- `cafecito-app` is a Create React App frontend using React 19, React Router DOM 7, Axios, and `lucide-react`.
- `src/components/templates/App/App.jsx` is the app wiring point. It wraps the app as `OrderProvider -> SessionProvider -> BrowserRouter -> Layout -> Routes`.
- Current frontend routes are `/` for the POS, `/seller/orders` for seller shift orders, and protected `/admin` children for sales, products, categories, employees, and shifts; do not invent e-commerce checkout/shipping/success routes.
- All API calls should go through modules in `src/services/` that use the shared `src/services/http.js` Axios instance.
- Do not call `fetch` or raw `axios` directly from components; using `http` keeps base URL, auth header, timeout, and token refresh behavior consistent.
- `http.js` reads `REACT_APP_API_URL` for the API base URL, injects `localStorage.authToken` as a Bearer token, and retries eligible `401/403` responses through `auth.refresh()`.
- `http.js` deliberately avoids retrying login/refresh requests and can trigger a logout callback if refresh fails.
- Cashier/session state is managed by `SessionContext`. It uses localStorage keys including `authToken`, `refreshToken`, `openedAt`, and `initialCash`.
- POS order/client state is managed by `OrderContext` plus `orderReducer`. It persists through `storageService` using logical keys `order` and `active_client`.
- `storageService` prefixes stored keys internally; use the service/context APIs rather than hand-editing localStorage keys from components.
- Product lists are cached in `sessionStorage` by `productService.js` for 5 minutes using keys beginning with `products_page_`.
- When product stock freshness matters after creating/updating orders or products, call or preserve `clearProductsCache()` behavior so stale catalog data is not shown.
- Checkout must keep the current order flow: `OrderPanel` calls `previewOrder()` first to get backend-calculated totals, then calls `createOrder()` after payment confirmation.
- The order service file is misspelled as `src/services/orderSevice.js`. Existing imports use that spelling; if renaming it, update imports repo-wide in the same change.
- Frontend component/context tests currently include `src/App.test.js`, `src/components/molecules/ClientSelector/ClientSelector.test.jsx`, and `src/context/OrderContext.test.jsx`.
- Cypress specs under `cafecito-app/cypress/e2e/` mock network calls with `cy.intercept`; do not treat them as backend-real coverage unless a spec explicitly starts and uses the real API.

## Documentation
- `docs/INDEX.md` is the documentation entrypoint; `docs/PRODUCT_SPEC.md` is the product source after executable code/config.
- `docs/GOVERNANCE.md` says code, tests, and executable config outrank prose; if docs conflict with code, fix the doc or record the gap instead of implementing stale behavior.
- Do not use `docs/archive/` as source of truth.

## Existing Instruction Files
- `cafecito-api/AGENTS.md` contains detailed backend route/model/validator/pattern notes. Read it before making API changes, but do not edit it unless explicitly requested.
- `cafecito-app/AGENTS.md` contains detailed frontend context/component/service/checkout notes. Read it before making frontend changes, but do not edit it unless explicitly requested.
- `AGENTS.testing.md` files exist under both packages. Verify their claims against package scripts/config before relying on them; executable config is the source of truth.
