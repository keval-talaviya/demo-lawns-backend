"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const base_dao_1 = require("../../../db/base.dao");
const report_model_1 = require("../model/report.model");
class ReportServiceClass extends base_dao_1.BaseDAO {
    constructor() {
        super(report_model_1.ReportModel);
    }
}
exports.ReportService = new ReportServiceClass();
//# sourceMappingURL=report.service.js.map