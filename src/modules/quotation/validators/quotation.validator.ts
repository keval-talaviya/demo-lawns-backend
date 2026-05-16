import Joi from 'joi';

export const createQuotationSchema = Joi.object({
  franchiseId: Joi.string().optional(),
  customerName: Joi.string().required(),
  customerEmail: Joi.string().email().required(),
  customerAddress: Joi.string().required(),
  quotationDate: Joi.date().iso().required(),
  expiryDate: Joi.date().iso().optional(),
  notes: Joi.string().allow(null, '').optional(),
  items: Joi.array()
    .items(
      Joi.object({
        description: Joi.string().required(),
        qty: Joi.number().required(),
        rate: Joi.number().required(),
        total: Joi.number().required(),
      }),
    )
    .min(1)
    .required(),
  subtotal: Joi.number().required(),
  tax: Joi.number().default(0),
  totalAmount: Joi.number().required(),
  status: Joi.number().valid(1, 2, 3, 4).default(1),
  createdBy: Joi.string().optional(),
});

export const updateQuotationSchema = Joi.object({
  customerName: Joi.string().optional(),
  customerEmail: Joi.string().email().optional(),
  customerAddress: Joi.string().optional(),
  quotationDate: Joi.date().iso().optional(),
  expiryDate: Joi.date().iso().optional(),
  notes: Joi.string().allow(null, '').optional(),
  items: Joi.array().items(
    Joi.object({
      description: Joi.string().required(),
      qty: Joi.number().required(),
      rate: Joi.number().required(),
      total: Joi.number().required(),
    }),
  ),
  subtotal: Joi.number().optional(),
  tax: Joi.number().optional(),
  totalAmount: Joi.number().optional(),
  status: Joi.number().valid(1, 2, 3, 4).optional(),
});
