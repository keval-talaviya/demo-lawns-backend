import Joi from 'joi';

export const userWalletValidator = {
    createTransaction: Joi.object({
        userId: Joi.string().required().trim(),
        type: Joi.number().valid(1, 2).required(), // 1: Withdraw, 2: Deposit
        amount: Joi.number().min(0.01).required(),
        purpose: Joi.string().required().trim().min(1).max(500),
        date: Joi.date().optional(),
    }),
};
