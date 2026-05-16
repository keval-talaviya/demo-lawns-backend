"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseDAO = void 0;
const pagination_1 = require("../common/pagination");
class BaseDAO {
    constructor(model) {
        this.model = model;
        this.softDeleteEnabled = Boolean(this.model.schema.path('isDeleted'));
    }
    withNotDeleted(filter) {
        if (!this.softDeleteEnabled) {
            return filter;
        }
        return {
            ...filter,
            isDeleted: { $ne: true },
        };
    }
    async create(doc) {
        return this.model.create(doc);
    }
    async createMany(docs) {
        return this.model.insertMany(docs);
    }
    async findById(id, projection, options) {
        return this.model.findOne({ _id: id, ...this.withNotDeleted({}) }, projection, options).exec();
    }
    async findOne(filter, projection, options) {
        return this.model.findOne(this.withNotDeleted(filter), projection, options).exec();
    }
    async find(filter = {}, projection, options) {
        return this.model.find(this.withNotDeleted(filter), projection, options).exec();
    }
    async updateById(id, update, options) {
        const hasOperator = update && typeof update === 'object' && Object.keys(update).some((k) => String(k).startsWith('$'));
        const updatePayload = hasOperator ? update : { $set: update };
        return this.model
            .findOneAndUpdate({ _id: id, ...this.withNotDeleted({}) }, updatePayload, { new: true, ...options })
            .exec();
    }
    async updateOne(filter, update, options) {
        const hasOperator = update && typeof update === 'object' && Object.keys(update).some((k) => String(k).startsWith('$'));
        const updatePayload = hasOperator ? update : { $set: update };
        return this.model
            .findOneAndUpdate(this.withNotDeleted(filter), updatePayload, { new: true, ...options })
            .exec();
    }
    async deleteById(id, options) {
        if (this.softDeleteEnabled) {
            return this.model
                .findOneAndUpdate({ _id: id, ...this.withNotDeleted({}) }, { isDeleted: true, deletedAt: new Date() }, { new: true, ...options })
                .exec();
        }
        return this.model.findByIdAndDelete(id, options).exec();
    }
    async paginate(filter = {}, options = {}) {
        const { skip, limit, page } = (0, pagination_1.buildPagination)(options);
        const query = this.model.find(this.withNotDeleted(filter));
        if (options.select) {
            query.select(options.select);
        }
        if (options.sort) {
            query.sort(options.sort);
        }
        if (options.populate) {
            query.populate(options.populate);
        }
        query.skip(skip).limit(limit);
        const [data, total] = await Promise.all([
            query.exec(),
            this.model.countDocuments(this.withNotDeleted(filter)),
        ]);
        return {
            data,
            total,
            page,
            limit,
        };
    }
    async aggregate(pipeline) {
        return this.model.aggregate(pipeline).exec();
    }
    async count(filter = {}) {
        return this.model.countDocuments(this.withNotDeleted(filter)).exec();
    }
}
exports.BaseDAO = BaseDAO;
//# sourceMappingURL=base.dao.js.map