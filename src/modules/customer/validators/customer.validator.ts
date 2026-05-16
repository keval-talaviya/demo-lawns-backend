import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  franchiseId: Joi.string().allow(null).optional(),
  name: Joi.string().required(),
  companyName: Joi.string().allow('', null).optional(),
  phone: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  postalCode: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  state: Joi.string().allow('', null).optional(),
  country: Joi.string().allow('', null).optional(),
  isActive: Joi.boolean().default(true)
});

export const updateCustomerSchema = Joi.object({
  franchiseId: Joi.string().allow(null).optional(),
  name: Joi.string().optional(),
  companyName: Joi.string().allow('', null).optional(),
  phone: Joi.string().allow('', null).optional(),
  email: Joi.string().email().allow('', null).optional(),
  address: Joi.string().allow('', null).optional(),
  postalCode: Joi.string().allow('', null).optional(),
  city: Joi.string().allow('', null).optional(),
  state: Joi.string().allow('', null).optional(),
  country: Joi.string().allow('', null).optional(),
  isActive: Joi.boolean().optional()
});

export const createTransactionSchema = Joi.object({
  amount: Joi.number().required(),
  type: Joi.number().valid(1, 2).required(), // 1: Withdraw, 2: Deposit
  purpose: Joi.string().required(),
  date: Joi.date().required()
});
