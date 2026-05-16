"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addFranchiseFilter = void 0;
const user_model_1 = require("../modules/user/model/user.model");
const constants_1 = require("../common/constants");
const mongoose_1 = require("mongoose");
/**
 * Middleware to add franchiseId filter to request for franchise admins
 * Master admin can see all, franchise admin can only see their own data
 */
const addFranchiseFilter = async (req, res, next) => {
    try {
        if (!req.user?.id) {
            return next();
        }
        const user = await user_model_1.UserModel.findById(req.user.id);
        if (!user) {
            return next();
        }
        // Master admin can see everything (no filter)
        if (user.role === constants_1.ROLES.MASTER_ADMIN) {
            req.franchiseFilter = undefined;
            return next();
        }
        // Franchise admin can only see their own franchise data
        if (user.role === constants_1.ROLES.FRANCHISE_ADMIN) {
            // If user is a franchise (isFranchise = true), use their own _id
            // Otherwise, use parentFranchiseId if available
            if (user.isFranchise) {
                req.franchiseFilter = user._id;
            }
            else if (user.parentId) {
                req.franchiseFilter = user.parentId;
            }
            else {
                // If no franchise association, they can't see anything
                req.franchiseFilter = new mongoose_1.Types.ObjectId('000000000000000000000000');
            }
            return next();
        }
        if (user.role === constants_1.ROLES.STAFF) {
            if (user.parentId) {
                req.franchiseFilter = user.parentId;
            }
            else {
                req.franchiseFilter = new mongoose_1.Types.ObjectId('000000000000000000000000');
            }
            return next();
        }
        return next();
    }
    catch (error) {
        return next();
    }
};
exports.addFranchiseFilter = addFranchiseFilter;
//# sourceMappingURL=franchiseFilter.js.map