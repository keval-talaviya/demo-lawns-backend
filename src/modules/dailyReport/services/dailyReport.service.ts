import { BaseDAO } from '../../../db/base.dao';
import { DailyReportModel } from '../model/dailyReport.model';
import { DailyReportDocument, CreateDailyReportDTO, UpdateDailyReportDTO } from '../interfaces/dailyReport.interface';

class DailyReportServiceClass extends BaseDAO<DailyReportDocument> {
  constructor() {
    super(DailyReportModel);
  }
  // TODO: implement service methods
}

export const DailyReportService = new DailyReportServiceClass();
