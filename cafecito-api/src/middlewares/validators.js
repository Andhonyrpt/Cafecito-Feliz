import { body, param, query } from "express-validator";

export const employeeIdValidation = (optional = false) => {
    const validator = body("employeeId")
        .trim()
        .toUpperCase()
        .matches(/^EMP-\d+$/)
        .withMessage('El ID de empleado debe tener el formato correcto (Ej: EMP-01)');

    return optional ? validator.optional() : validator.notEmpty().withMessage('El ID de empleado es obligatorio')
};

export const passwordValidation = () =>
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/\d/)
        .withMessage("Password must contain at least one number")
        .matches(/[a-zA-Z]/)
        .withMessage("Password must contain at least one letter");

// Validación de contraseña completa con número y letra requeridos
export const fullPasswordValidation = (required = true) => {
    const validator = body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long")
        .matches(/\d/)
        .withMessage("Password must contain at least one number")
        .matches(/[a-zA-Z]/)
        .withMessage("Password must contain at least one letter");

    return required ? validator.notEmpty().withMessage("Password is required") : validator.optional();
};

// Validación de password para login (solo verifica que no esté vacío)
export const passwordLoginValidation = () =>
    body("password").notEmpty().withMessage("Password is required");

export const pinValidation = () =>
    body('password') // O 'pin', dependiendo de cómo caches el campo en el req.body
        .trim()
        .isNumeric()
        .withMessage('El PIN solo debe contener números.')
        .isLength({ min: 5 })
        .withMessage('El PIN debe tener al menos 5 dígitos.');

export const displayNameValidation = (optional = false) => {
    const validator = body('displayName')
        .isLength({ min: 2, max: 50 })
        .withMessage("Display name must be between 2 and 50 characters")
        .trim()
        .escape();

    return optional ? validator.optional() : validator.notEmpty().withMessage('Display name is required');
};

// Validación de displayName con caracteres especiales permitidos
export const userDisplayNameValidation = (required = true) => {
    const validator = body("displayName")
        .isLength({ min: 2, max: 50 })
        .withMessage("Display name must be between 2 and 50 characters")
        .matches(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s]+$/)
        .withMessage("Display name must contain only letters, numbers and spaces")
        .trim()
        .escape();

    return required
        ? validator.notEmpty().withMessage("Display name is required")
        : validator.optional();
};

export const paginationValidation = () => [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("Limit must be between 1 and 100"),
];

export const urlValidation = (field = "url") =>
    body(field).optional().isURL().withMessage(`${field} must be a valid URL`);

// Validación de MongoID en body
export const bodyMongoIdValidation = (field, label, optional = false) => {
    const validator = body(field).isMongoId().withMessage(`Invalid ${label} format`);

    return optional ? validator.optional({ nullable: true }) : validator.notEmpty().withMessage(`${label} is required`);
};

// Validación de MongoID en param 
export const mongoIdValidation = (field = "id", customLabel = null) => {
    const label = customLabel || field;
    return param(field).isMongoId().withMessage(`${label} must be a valid MongoDB ObjectId`);
};

// Validación de MongoID en query
export const queryMongoIdValidation = (field, label) =>
    query(field).optional().isMongoId().withMessage(`Invalid ${label} format`);

// Validación de boolean
export const booleanValidation = (field) =>
    body(field).optional().isBoolean().withMessage(`${field} must be a boolean`);

// Validación de role
export const roleValidation = () =>
    body("role")
        .optional()
        .isIn(["admin", "vendedor", "barista"])
        .withMessage("Role must be admin, customer, or guest");

// Validación de sort field
export const sortFieldValidation = (allowedFields = []) =>
    query("sort")
        .optional()
        .isIn(allowedFields)
        .withMessage(`Sort must be one of: ${allowedFields.join(", ")}`);

// Validación de order (asc/desc)
export const orderValidation = () =>
    query("order").optional().isIn(["asc", "desc"]).withMessage("Order must be asc or desc");

// Validación de role en query
export const queryRoleValidation = () =>
    query("role")
        .optional()
        .isIn(["admin", "vendedor", "barista"])
        .withMessage("Role must be admin, customer, or guest");

// Validación de isActive en query
export const queryIsActiveValidation = () =>
    query("isActive")
        .optional()
        .isIn(["true", "false"])
        .withMessage("isActive must be true or false");

// Validación de email en body
export const emailValidation = (optional = false) => {
    const validator = body("email")
        .trim()
        .normalizeEmail()
        .isEmail()
        .withMessage("Valid email is required");

    return optional ? validator.optional() : validator.notEmpty().withMessage("Email is required");
};

// Validación de email en query (para check-email, búsquedas, etc.)
export const queryEmailValidation = () =>
    query("email")
        .notEmpty()
        .withMessage("Email is required")
        .isEmail()
        .withMessage("Valid email is required")
        .normalizeEmail();

export const quantityValidation = (field = "quantity", optional = false) => {
    const validator = body(field).isInt({ min: 1 }).withMessage(`${field} must be at least 1`);

    return optional ? validator.optional() : validator.notEmpty().withMessage(`${field} is required`);
};

export const priceValidation = (field = "price") =>
    body(field).isFloat({ min: 0 }).withMessage(`${field} must be a positive number`);

export const priceOptionalValidation = (field = "price") =>
    body(field)
        .optional()
        .isFloat({ min: 0 })
        .withMessage(`${field} must be a positive number`);

export const orderStatusValidation = (optional = false) => {
    const validator = body("status")
        .trim()
        .toLowerCase()
        .isIn(["pending", "processing", "shipped", "delivered", "cancelled"])
        .withMessage("Invalid status value");

    return optional ? validator.optional() : validator.notEmpty().withMessage("Status is required");
};

export const productNameValidation = (required = true) => {
    const validator = body("name")
        .isLength({ min: 2, max: 100 })
        .withMessage("Name must be between 2 and 100 characters")
        .trim();

    return required ? validator.notEmpty().withMessage("Name is required") : validator.optional();
};

// Validación de stock
export const stockValidation = (field = "stock") =>
    body(field)
        .notEmpty()
        .withMessage(`${field} is required`)
        .isInt({ min: 0 })
        .withMessage(`${field} must be a non-negative integer`);

export const imageUrlValidation = (field = "imageUrl", required = true) => {
    const validator = body(field)
        .trim()
        .custom((value) => {
            if (!value || typeof value !== "string" || value.trim().length === 0) {
                throw new Error("La URL de la imagen debe ser una cadena de texto no vacía.");
            }
            const isRelative = value.trim().startsWith("/");
            const isFullUrl = /^(https?:\/\/)/.test(value);

            if (!isRelative && !isFullUrl) {
                throw new Error("La imagen debe ser una URL válida o una ruta relativa que empiece con /");
            }
            return true;
        });

    return required ? validator.notEmpty().withMessage("La URL de la imagen es obligatoria") : validator.optional();
};

// Validación de nombre general
export const generalNameValidation = (field = "name", required = true, maxLength = 100) => {
    const validator = body(field)
        .trim()
        .isLength({ min: 1, max: maxLength })
        .withMessage(`${field} must be between 1 and ${maxLength} characters`);

    return required ? validator.notEmpty().withMessage(`${field} is required`) : validator.optional();
};