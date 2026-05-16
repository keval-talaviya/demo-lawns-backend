import { BaseDAO } from '../../../db/base.dao';
import { JobScheduleModel } from '../model/jobSchedule.model';
import { JobScheduleDocument, CreateJobScheduleDTO, UpdateJobScheduleDTO } from '../interfaces/jobSchedule.interface';

class JobScheduleServiceClass extends BaseDAO<JobScheduleDocument> {
  constructor() {
    super(JobScheduleModel);
  }
  // TODO: implement service methods
}

export const JobScheduleService = new JobScheduleServiceClass();
