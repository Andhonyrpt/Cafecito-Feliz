const PREFIX = "cafecito";

/**
 * Servicio unificado para gestionar persistencia local de forma segura.
 */
const storageService = {
    /**
     * Guarda un valor en localStorage con prefijo.
     * @param {string} key 
     * @param {any} value 
     * @param {boolean} obfuscate Si es true, aplica una codificación Base64 básica.
     */
    set(key, value, obfuscate = false) {
        try {
            let stringValue = JSON.stringify(value);
            if (obfuscate) {
                stringValue = btoa(unescape(encodeURIComponent(stringValue)));
            }
            localStorage.setItem(`${PREFIX}${key}`, stringValue);
        } catch (error) {
            console.error(`Error saving to storage: ${key}`, error);
        }
    },

    /**
     * Obtiene un valor de localStorage.
     * @param {string} key 
     * @param {boolean} deobfuscate Si el valor fue ofuscado al guardarse.
     */
    get(key, deobfuscate = false) {
        try {
            let value = localStorage.getItem(`${PREFIX}${key}`);
            if (!value) return null;

            if (deobfuscate) {
                value = decodeURIComponent(escape(atob(value)));
            }
            return JSON.parse(value);
        } catch (error) {
            console.error(`Error reading from storage: ${key}`, error);
            return null;
        }
    },

    /**
     * Elimina una clave.
     */
    remove(key) {
        localStorage.removeItem(`${PREFIX}${key}`);
    },

    /**
     * Elimina el prefijo de una clave si existe y retorna el valor original (limpieza).
     */
    removeRaw(rawKey) {
        localStorage.removeItem(rawKey);
    },

    /**
     * Limpia todo el almacenamiento del dominio con el prefijo actual.
     */
    clear() {
        Object.keys(localStorage)
            .filter(key => key.startsWith(PREFIX))
            .forEach(key => localStorage.removeItem(key));
    }
};

export default storageService;
