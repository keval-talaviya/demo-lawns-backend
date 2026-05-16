import Joi from 'joi';

export const companySettingsValidator = {
    create: Joi.object({
        companyName: Joi.string().required().trim().min(1).max(200),
        gstNumber: Joi.string().required().trim(),
        gstRate: Joi.number().required().min(0).max(100),
    }),

    update: Joi.object({
        companyName: Joi.string().optional().trim().min(1).max(200),
        gstNumber: Joi.string().optional().trim(),
        gstRate: Joi.number().optional().min(0).max(100),
    }),
};
