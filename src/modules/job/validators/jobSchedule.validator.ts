import Joi from 'joi';

export const monthViewSchema = Joi.object({
    query: Joi.object({
        year: Joi.number().integer().min(2000).max(2100).required(),
        month: Joi.number().integer().min(1).max(12).required(),
        franchiseId: Joi.string().optional(),
        status: Joi.number().optional(),
        assignedTo: Joi.string().optional(),
    }),
});

export const weekViewSchema = Joi.object({
    query: Joi.object({
        startDate: Joi.date().iso().required(),
        endDate: Joi.date().iso().required(),
        franchiseId: Joi.string().optional(),
        status: Joi.number().optional(),
        assignedTo: Joi.string().optional(),
    }),
});

export const dayViewSchema = Joi.object({
    query: Joi.object({
        date: Joi.date().iso().required(),
        franchiseId: Joi.string().optional(),
        status: Joi.number().optional(),
        assignedTo: Joi.string().optional(),
    }),
});

export const scheduleStatsSchema = Joi.object({
    query: Joi.object({
        startDate: Joi.date().iso().required(),
        endDate: Joi.date().iso().required(),
        franchiseId: Joi.string().optional(),
    }),
});
