import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { CompanySettingsService } from '../services/companySettings.service';
import { successResponse, errorResponse } from '../../../common/response';
import { COMPANY_SETTINGS_MESSAGES } from '../messages/message';
import { AuthRequest } from '../../../middlewares/authMiddleware';
import { Types } from 'mongoose';
import { FileService } from '../../../services/file.service';
import path from 'path';
import { config } from '../../../config';

export const CompanySettingsController = {
    /**
     * Create company settings (only if not exists)
     */
    async create(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const loggedUser = req.user;

            if (!loggedUser) {
                return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized access');
            }

            // Check if settings already exist
            const exists = await CompanySettingsService.exists();
            if (exists) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, COMPANY_SETTINGS_MESSAGES.ALREADY_EXISTS);
            }



            let companyLogo = '';
            if (req.file) {
                companyLogo = `/uploads/${req.file.filename}`;
            }

            const settings = await CompanySettingsService.create({
                companyName: req.body.companyName,
                companyLogo,
                gstNumber: req.body.gstNumber,
                gstRate: Number(req.body.gstRate),
                createdBy: new Types.ObjectId(loggedUser.id),
            });

            res.status(StatusCodes.CREATED);
            return successResponse(res, settings, COMPANY_SETTINGS_MESSAGES.CREATED);
        } catch (error: any) {
            // Clean up uploaded file if error occurs
            if (req.file) {
                FileService.removeFile(req.file.path);
            }
            return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to create company settings', { error });
        }
    },

    /**
     * Get company settings
     */
    async get(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const settings = await CompanySettingsService.get();

            if (!settings) {
                return errorResponse(res, StatusCodes.NOT_FOUND, COMPANY_SETTINGS_MESSAGES.NOT_FOUND);
            }

            return successResponse(res, settings, COMPANY_SETTINGS_MESSAGES.RETRIEVED);
        } catch (error: any) {
            return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to get company settings', { error });
        }
    },

    /**
     * Update company settings
     */
    async update(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const loggedUser = req.user;

            if (!loggedUser) {
                return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized access');
            }

            const settings = await CompanySettingsService.get();
            if (!settings) {
                return errorResponse(res, StatusCodes.NOT_FOUND, COMPANY_SETTINGS_MESSAGES.NOT_FOUND);
            }

            const updateData: any = {
                updatedBy: new Types.ObjectId(loggedUser.id),
            };

            // Add fields to update if provided
            if (req.body.companyName) updateData.companyName = req.body.companyName;
            if (req.body.gstNumber) updateData.gstNumber = req.body.gstNumber;
            if (req.body.gstRate !== undefined) updateData.gstRate = Number(req.body.gstRate);



            // Handle logo upload
            if (req.file) {
                // Delete old logo if exists
                if (settings.companyLogo) {
                    const oldLogoPath = path.join(config.fileUploadPath, path.basename(settings.companyLogo));
                    FileService.removeFile(oldLogoPath);
                }
                updateData.companyLogo = `/uploads/${req.file.filename}`;
            }

            const updated = await CompanySettingsService.update(String(settings._id), updateData);

            return successResponse(res, updated, COMPANY_SETTINGS_MESSAGES.UPDATED);
        } catch (error: any) {
            // Clean up uploaded file if error occurs
            if (req.file) {
                FileService.removeFile(req.file.path);
            }
            return errorResponse(res, StatusCodes.BAD_REQUEST, error.message || 'Failed to update company settings', { error });
        }
    },

    /**
     * Delete company logo
     */
    async deleteLogo(req: AuthRequest, res: Response): Promise<Response> {
        try {
            const loggedUser = req.user;

            if (!loggedUser) {
                return errorResponse(res, StatusCodes.UNAUTHORIZED, 'Unauthorized access');
            }

            const settings = await CompanySettingsService.get();
            if (!settings) {
                return errorResponse(res, StatusCodes.NOT_FOUND, COMPANY_SETTINGS_MESSAGES.NOT_FOUND);
            }

            if (!settings.companyLogo) {
                return errorResponse(res, StatusCodes.BAD_REQUEST, 'No logo to delete');
            }

            // Delete logo file
            const logoPath = path.join(config.fileUploadPath, path.basename(settings.companyLogo));
            FileService.removeFile(logoPath);

            // Update settings to remove logo
            const updated = await CompanySettingsService.update(String(settings._id), {
                companyLogo: '',
                updatedBy: new Types.ObjectId(loggedUser.id),
            });

            return successResponse(res, updated, COMPANY_SETTINGS_MESSAGES.LOGO_DELETED);
        } catch (error: any) {
            return errorResponse(res, StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to delete logo', { error });
        }
    },
};
