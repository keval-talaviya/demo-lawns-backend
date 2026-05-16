"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyReportService = void 0;
const base_dao_1 = require("../../../db/base.dao");
const dailyReport_model_1 = require("../model/dailyReport.model");
class DailyReportServiceClass extends base_dao_1.BaseDAO {
    constructor() {
        super(dailyReport_model_1.DailyReportModel);
    }
}
exports.DailyReportService = new DailyReportServiceClass();
//# sourceMappingURL=dailyReport.service.js.map