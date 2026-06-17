# Repository Guide

## Layout
- This is not an npm workspace: run commands inside `cafecito-api/` or `cafecito-app/`; each package has its own `package-lock.json`.
- `cafecito-api/` is an Express 5 + Mongoose API mounted under `/api`; `server.js` exports `app` for tests and only listens when `NODE_ENV !== "test"`.
- `cafecito-app/` is a Create React App POS frontend; `src/components/App/App.jsx` wires `OrderProvider -> SessionProvider -> BrowserRouter -> Layout -> Home` and currently only defines the `/` route.

## Commands
- API setup/dev: `cd cafecito-api`, `npm install`, `npm run dev`, `npm start`.
- API tests: `npm test`; focused file: `npm test -- tests/auth.test.js`; watch: `npm run test:watch`; coverage: `npm run test:coverage`.
- Frontend setup/dev: `cd cafecito-app`, `npm install`, `npm start`, `npm run build`.
- Frontend tests are CRA/Jest: use `npm test -- --watchAll=false` for a non-watch run or `npm test -- App.test.js --watchAll=false` for the current single test file.

## Environment
- API env keys are documented in `cafecito-api/.env.example`: `PORT`, `NODE_ENV`, `MONGODB_URI`, `MONGODB_DB`, `CORS_ORIGIN`.
- Frontend HTTP base URL is `REACT_APP_API_URL` read by `cafecito-app/src/services/http.js`.
- API tests use `mongodb-memory-server` from `tests/setup/setup.js`; `NODE_ENV=test` skips the real Mongo connection in `src/config/database.js`.

## Backend Conventions
- Backend is ESM (`"type": "module"`): use `import/export` and include `.js` on local imports.
- Keep business logic in controllers; there is no backend service layer in `src/services/`.
- Route pattern is validators from `src/middlewares/validators.js`, then `validate`, then controller; protected admin routes use `authMiddleware` before `isAdmin`.
- Controllers should pass unexpected errors to `next(error)` so `src/middlewares/errorHandler.js` logs to `logs/error.log` and formats the response.
- New Mongoose schemas should keep the repo pattern of `{ timestamps: true }`.

## Frontend Conventions
- All API calls should go through service modules using the shared `http` axios instance; do not call `fetch` or raw `axios` in components.
- `http.js` injects `localStorage.authToken` and refreshes via `auth.refresh()` on `401/403`; auth/session state also uses `refreshToken`, `openedAt`, and `initialCash` in localStorage.
- POS cart/client state lives in `OrderContext` with `orderReducer` and localStorage keys `order` and `active_client`; cashier/session state lives in `SessionContext`.
- Checkout first calls `previewOrder()` for backend totals, then `createOrder()`; preserve this flow when changing order submission.
- The order service file is intentionally misspelled as `src/services/orderSevice.js`; update imports repo-wide if renaming it.

## Existing Guidance
- Package-level `AGENTS.md` files add local notes; prefer this root file when they conflict with executable config.
- `AGENTS.testing.md` files are stale in places: the API uses Jest, not Vitest, and the frontend has Cypress installed but no Cypress config, scripts, or `cypress/` tree.
