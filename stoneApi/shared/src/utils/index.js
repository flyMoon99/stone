"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApiResponse = createApiResponse;
exports.createSuccessResponse = createSuccessResponse;
exports.createErrorResponse = createErrorResponse;
exports.createPaginationResponse = createPaginationResponse;
exports.generateId = generateId;
exports.formatDate = formatDate;
exports.deepClone = deepClone;
exports.debounce = debounce;
exports.throttle = throttle;
exports.isValidEmail = isValidEmail;
exports.isValidPhone = isValidPhone;
exports.hashPassword = hashPassword;
exports.validatePasswordStrength = validatePasswordStrength;
function createApiResponse(success, data, message, code) {
    return {
        success,
        data,
        message,
        code,
        timestamp: Date.now()
    };
}
function createSuccessResponse(data, message = 'Success') {
    return createApiResponse(true, data, message);
}
function createErrorResponse(message, code, data = null) {
    return createApiResponse(false, data, message, code);
}
function createPaginationResponse(items, total, page, pageSize) {
    return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
    };
}
function generateId() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return format
        .replace('YYYY', year.toString())
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
    return obj;
}
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}
function throttle(func, delay) {
    let lastCall = 0;
    return (...args) => {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
}
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
function isValidPhone(phone) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
}
function hashPassword(password) {
    if (typeof globalThis !== 'undefined' && 'btoa' in globalThis) {
        return globalThis.btoa(password);
    }
    throw new Error('Password hashing not supported in this environment');
}
function validatePasswordStrength(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push('密码长度至少8位');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('密码必须包含大写字母');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('密码必须包含小写字母');
    }
    if (!/\d/.test(password)) {
        errors.push('密码必须包含数字');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
//# sourceMappingURL=index.js.map