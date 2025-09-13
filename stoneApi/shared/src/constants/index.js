"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STORAGE_KEYS = exports.TAB_CONFIG = exports.PAGINATION = exports.JWT_CONFIG = exports.ERROR_CODES = exports.HTTP_STATUS = exports.API_PATHS = void 0;
exports.API_PATHS = {
    ADMIN: {
        LOGIN: '/api/admin/login',
        REFRESH: '/api/admin/refresh',
        PROFILE: '/api/admin/profile',
        LIST: '/api/admin/list',
        CREATE: '/api/admin/create',
        UPDATE: '/api/admin/update',
        DELETE: '/api/admin/delete'
    },
    MEMBER: {
        LOGIN: '/api/member/login',
        PROFILE: '/api/member/profile',
        LIST: '/api/member/list',
        CREATE: '/api/member/create',
        UPDATE: '/api/member/update',
        DELETE: '/api/member/delete'
    },
    PUBLIC: {
        HEALTH: '/api/public/health'
    }
};
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};
exports.ERROR_CODES = {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    USER_INACTIVE: 'USER_INACTIVE',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    NOT_FOUND: 'NOT_FOUND'
};
exports.JWT_CONFIG = {
    ADMIN_EXPIRES_IN: '7d',
    MEMBER_EXPIRES_IN: '7d',
    REFRESH_THRESHOLD: '1d'
};
exports.PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100
};
exports.TAB_CONFIG = {
    MAX_TABS: 10,
    DEFAULT_TAB_ID: '/dashboard',
    CACHE_KEY: 'stone_admin_tabs'
};
exports.STORAGE_KEYS = {
    ADMIN_TOKEN: 'stone_admin_token',
    ADMIN_REFRESH_TOKEN: 'stone_admin_refresh_token',
    MEMBER_TOKEN: 'stone_member_token',
    TABS_STATE: 'stone_tabs_state',
    USER_PREFERENCES: 'stone_user_preferences'
};
//# sourceMappingURL=index.js.map