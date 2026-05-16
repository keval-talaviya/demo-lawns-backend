import Joi from 'joi';

export const createFranchiseSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  password: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  postalCode: Joi.string().required(),
  countryCode: Joi.number().required(),
  country: Joi.string().required(),
  phone: Joi.string().required(),
  email: Joi.string().email().required(),
  isActive: Joi.boolean().default(true),
});

export const updateFranchiseSchema = Joi.object({
  name: Joi.string().allow('', null),
  address: Joi.string().allow('', null),
  city: Joi.string().allow('', null),
  state: Joi.string().allow('', null),
  postalCode: Joi.string().allow('', null),
  countryCode: Joi.number(),
  country: Joi.string().allow('', null),
  phone: Joi.string().allow('', null),
  email: Joi.string().email().allow('', null),
  isActive: Joi.boolean()
});





