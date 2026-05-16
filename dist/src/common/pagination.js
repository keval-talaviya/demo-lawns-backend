"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPagination = void 0;
const buildPagination = ({ page = 1, limit = 25, }) => {
    const safePage = Number(page) > 0 ? Number(page) : 1;
    const safeLimit = Number(limit) > 0 ? Number(limit) : 25;
    return {
        page: safePage,
        skip: (safePage - 1) * safeLimit,
        limit: safeLimit,
    };
};
exports.buildPagination = buildPagination;
//# sourceMappingURL=pagination.js.map