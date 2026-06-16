# Guía de Testing - Cafecito API (Vitest)

Este documento establece los patrones estándar para la creación de pruebas unitarias en los controladores de la API utilizando **Vitest**.

## Importaciones (Sin Globals)

En este proyecto no se utilizan globals para los tests. Todos los métodos de Vitest deben importarse explícitamente al inicio del archivo:

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
```

## Helper Reutilizable: `createMockReqRes`

Para aislar los tests de los controladores, nunca levantes el servidor Express completo en las pruebas unitarias. Usa la siguiente función helper para simular (mockear) `req`, `res` y `next`:

```javascript
// helpers/testHelpers.js
import { vi } from 'vitest';

export const createMockReqRes = (options = {}) => {
    const req = {
        body: options.body || {},
        params: options.params || {},
        query: options.query || {},
        user: options.user || null // Para endpoints autenticados
    };
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
        send: vi.fn(),
    };
    const next = vi.fn();

    return { req, res, next };
};
```

## Cómo Mockear un Modelo Mongoose y Dependencias

Para probar la lógica de negocio sin tocar la base de datos real, debemos usar `vi.mock()` para interceptar el modelo y sus métodos.

```javascript
// 1. Importar las dependencias reales
import User from '../../src/models/user.js';
import bcrypt from 'bcrypt';

// 2. Definir los mocks de las rutas de importación
vi.mock('../../src/models/user.js');
vi.mock('bcrypt');

// 3. En el test, definir el valor de retorno simulado:
// Métodos estáticos:
User.findOne.mockResolvedValue({ _id: '123', displayName: 'Test User' });

// Métodos de instancia (ej. new User().save()):
User.prototype.save = vi.fn().mockResolvedValue(true);
```

## Ejemplo Completo: Testing de `register` y `login`

A continuación, un ejemplo de cómo implementar las pruebas para `authController.js`.

```javascript
// tests/controllers/authController.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { register, login } from '../../src/controllers/authController.js';
import { createMockReqRes } from '../helpers/testHelpers.js';

// Mocks
import User from '../../src/models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('../../src/models/user.js');
vi.mock('bcrypt');
vi.mock('jsonwebtoken');

describe('Auth Controller', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Variables de entorno necesarias
        process.env.JWT_SECRET = 'secret';
        process.env.REFRESH_TOKEN_SECRET = 'refresh-secret';
    });

    describe('register()', () => {
        it('debe registrar un nuevo usuario y retornar 201', async () => {
            const { req, res, next } = createMockReqRes({
                body: { displayName: 'John', employeeId: 'EMP-01', password: '123', role: 'vendedor' }
            });

            // Simulamos que el usuario NO existe
            User.findOne.mockResolvedValue(null);
            // Simulamos el hash
            bcrypt.hash.mockResolvedValue('hashed_password');
            // Simulamos el guardado exitoso
            User.prototype.save = vi.fn().mockResolvedValue(true);

            await register(req, res, next);

            expect(User.findOne).toHaveBeenCalledWith({ employeeId: 'EMP-01' });
            expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ displayName: 'John', employeeId: 'EMP-01', role: 'vendedor' });
            expect(next).not.toHaveBeenCalled();
        });

        it('debe retornar el usuario y 201 si el usuario ya existe', async () => {
            const { req, res, next } = createMockReqRes({
                body: { displayName: 'John', employeeId: 'EMP-01' }
            });

            User.findOne.mockResolvedValue({ employeeId: 'EMP-01' });

            await register(req, res, next);

            expect(User.prototype.save).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
        });

        it('debe llamar a next(error) si hay un error de base de datos', async () => {
            const { req, res, next } = createMockReqRes();
            const error = new Error('DB Error');
            User.findOne.mockRejectedValue(error);

            await register(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
        });
    });

    describe('login()', () => {
        it('debe hacer login exitoso, generar tokens y retornar 200', async () => {
            const { req, res, next } = createMockReqRes({
                body: { employeeId: 'EMP-01', password: '123' }
            });

            const mockUser = {
                _id: 'mongo-id-123',
                displayName: 'John',
                employeeId: 'EMP-01',
                hashPassword: 'hashed',
                role: 'admin',
                avatar: 'url.png'
            };

            User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValueOnce('mocked_token').mockReturnValueOnce('mocked_refresh');

            await login(req, res, next);

            expect(bcrypt.compare).toHaveBeenCalledWith('123', 'hashed');
            expect(jwt.sign).toHaveBeenCalledTimes(2);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                token: 'mocked_token',
                refreshToken: 'mocked_refresh',
                user: expect.any(Object)
            }));
        });

        it('debe retornar 400 si el usuario no existe', async () => {
            const { req, res, next } = createMockReqRes({ body: { employeeId: 'EMP-99' } });
            User.findOne.mockResolvedValue(null);

            await login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: "User doesn't exist. You have to sign in" });
        });

        it('debe retornar 400 si la contraseña es incorrecta', async () => {
            const { req, res, next } = createMockReqRes({ body: { employeeId: 'EMP-01', password: 'bad' } });
            User.findOne.mockResolvedValue({ hashPassword: 'hashed' });
            bcrypt.compare.mockResolvedValue(false);

            await login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
        });
    });
});
```

## Checklist de Casos Obligatorios por Endpoint

Al testear cualquier nuevo controlador, el agente debe asegurarse de cubrir los siguientes escenarios:

- [ ] **Happy Path**: El flujo principal funciona, se llama a los métodos correspondientes con los argumentos correctos y se retorna el código de éxito (`200` o `201`).
- [ ] **Entidad No Encontrada**: Simulando que el modelo de Mongoose retorna `null` y validando que el controlador retorne código `404` (o el esperado según lógica de negocio).
- [ ] **Errores de Lógica**: Por ejemplo, validar que falle si un password es incorrecto (`400`/`401`), o si el usuario no está activo.
- [ ] **Bloque Catch**: Simular un rechazo en una promesa de base de datos (`mockRejectedValue`) y comprobar que el error es capturado enviándolo correctamente a `next(error)`.
- [ ] **Aislamiento de tests**: Utilizar `vi.clearAllMocks()` dentro de un bloque `beforeEach` para asegurar que el recuento de llamadas (`toHaveBeenCalledTimes`) no se filtre a otras pruebas.
