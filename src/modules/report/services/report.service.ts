import { BaseDAO } from '../../../db/base.dao';
import { ReportModel } from '../model/report.model';
import { ReportDocument, CreateReportDTO, UpdateReportDTO } from '../interfaces/report.interface';

class ReportServiceClass extends BaseDAO<ReportDocument> {
  constructor() {
    super(ReportModel);
  }
  // TODO: implement service methods
}

export const ReportService = new ReportServiceClass();
