"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerService = void 0;
const base_dao_1 = require("../../../db/base.dao");
const customer_model_1 = require("../model/customer.model");
const serialNumber_service_1 = require("../../../common/serialNumber.service");
class CustomerServiceClass extends base_dao_1.BaseDAO {
    constructor() {
        super(customer_model_1.CustomerModel);
    }
    async createCustomer(payload, franchiseId) {
        // Generate unique code: CUST-0001
        const uniqueCode = await serialNumber_service_1.SerialNumberService.generateUniqueCode({
            prefix: 'CUST-',
            padding: 4,
            model: customer_model_1.CustomerModel,
        });
        return this.create({
            ...payload,
            franchiseId,
            uniqueCode,
        });
    }
    async updateCustomer(id, payload) {
        return this.updateById(id, payload);
    }
    async getCustomersByFranchise(franchiseId, options = {}) {
        return this.paginate({ franchiseId }, options);
    }
}
exports.CustomerService = new CustomerServiceClass();
//# sourceMappingURL=customer.service.js.map