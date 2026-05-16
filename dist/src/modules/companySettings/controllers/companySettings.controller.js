"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanySettingsController = void 0;
const http_status_codes_1 = require("http-status-codes");
const companySettings_service_1 = require("../services/companySettings.service");
const response_1 = require("../../../common/response");
const message_1 = require("../messages/message");
const mongoose_1 = require("mongoose");
const file_service_1 = require("../../../services/file.service");
const path_1 = __importDefault(require("path"));
const config_1 = require("../../../config");
exports.CompanySettingsController = {
    /**
     * Create company settings (only if not exists)
     */
    async create(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized access');
            }
            // Check if settings already exist
            const exists = await companySettings_service_1.CompanySettingsService.exists();
            if (exists) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, message_1.COMPANY_SETTINGS_MESSAGES.ALREADY_EXISTS);
            }
            let companyLogo = '';
            if (req.file) {
                companyLogo = `/uploads/${req.file.filename}`;
            }
            const settings = await companySettings_service_1.CompanySettingsService.create({
                companyName: req.body.companyName,
                companyLogo,
                gstNumber: req.body.gstNumber,
                gstRate: Number(req.body.gstRate),
                createdBy: new mongoose_1.Types.ObjectId(loggedUser.id),
            });
            res.status(http_status_codes_1.StatusCodes.CREATED);
            return (0, response_1.successResponse)(res, settings, message_1.COMPANY_SETTINGS_MESSAGES.CREATED);
        }
        catch (error) {
            // Clean up uploaded file if error occurs
            if (req.file) {
                file_service_1.FileService.removeFile(req.file.path);
            }
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to create company settings', { error });
        }
    },
    /**
     * Get company settings
     */
    async get(req, res) {
        try {
            const settings = await companySettings_service_1.CompanySettingsService.get();
            if (!settings) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.COMPANY_SETTINGS_MESSAGES.NOT_FOUND);
            }
            return (0, response_1.successResponse)(res, settings, message_1.COMPANY_SETTINGS_MESSAGES.RETRIEVED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get company settings', { error });
        }
    },
    /**
     * Update company settings
     */
    async update(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized access');
            }
            const settings = await companySettings_service_1.CompanySettingsService.get();
            if (!settings) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.COMPANY_SETTINGS_MESSAGES.NOT_FOUND);
            }
            const updateData = {
                updatedBy: new mongoose_1.Types.ObjectId(loggedUser.id),
            };
            // Add fields to update if provided
            if (req.body.companyName)
                updateData.companyName = req.body.companyName;
            if (req.body.gstNumber)
                updateData.gstNumber = req.body.gstNumber;
            if (req.body.gstRate !== undefined)
                updateData.gstRate = Number(req.body.gstRate);
            // Handle logo upload
            if (req.file) {
                // Delete old logo if exists
                if (settings.companyLogo) {
                    const oldLogoPath = path_1.default.join(config_1.config.fileUploadPath, path_1.default.basename(settings.companyLogo));
                    file_service_1.FileService.removeFile(oldLogoPath);
                }
                updateData.companyLogo = `/uploads/${req.file.filename}`;
            }
            const updated = await companySettings_service_1.CompanySettingsService.update(String(settings._id), updateData);
            return (0, response_1.successResponse)(res, updated, message_1.COMPANY_SETTINGS_MESSAGES.UPDATED);
        }
        catch (error) {
            // Clean up uploaded file if error occurs
            if (req.file) {
                file_service_1.FileService.removeFile(req.file.path);
            }
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, error.message || 'Failed to update company settings', { error });
        }
    },
    /**
     * Delete company logo
     */
    async deleteLogo(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized access');
            }
            const settings = await companySettings_service_1.CompanySettingsService.get();
            if (!settings) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, message_1.COMPANY_SETTINGS_MESSAGES.NOT_FOUND);
            }
            if (!settings.companyLogo) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'No logo to delete');
            }
            // Delete logo file
            const logoPath = path_1.default.join(config_1.config.fileUploadPath, path_1.default.basename(settings.companyLogo));
            file_service_1.FileService.removeFile(logoPath);
            // Update settings to remove logo
            const updated = await companySettings_service_1.CompanySettingsService.update(String(settings._id), {
                companyLogo: '',
                updatedBy: new mongoose_1.Types.ObjectId(loggedUser.id),
            });
            return (0, response_1.successResponse)(res, updated, message_1.COMPANY_SETTINGS_MESSAGES.LOGO_DELETED);
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete logo', { error });
        }
    },
};
//# sourceMappingURL=companySettings.controller.js.map