"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobScheduleService = void 0;
const base_dao_1 = require("../../../db/base.dao");
const jobSchedule_model_1 = require("../model/jobSchedule.model");
class JobScheduleServiceClass extends base_dao_1.BaseDAO {
    constructor() {
        super(jobSchedule_model_1.JobScheduleModel);
    }
}
exports.JobScheduleService = new JobScheduleServiceClass();
//# sourceMappingURL=jobSchedule.service.js.map