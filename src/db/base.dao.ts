import {
  FilterQuery,
  Model,
  UpdateQuery,
  ProjectionType,
  QueryOptions,
  PipelineStage,
  HydratedDocument,
} from 'mongoose';
import { PaginationParams, buildPagination, PaginationResult } from '../common/pagination';

export interface SoftDeleteDocument {
  isDeleted?: boolean;
  deletedAt?: Date | null;
}

export interface PaginateOptions<T> extends PaginationParams {
  sort?: Record<string, 1 | -1> | string;
  select?: ProjectionType<T>;
  populate?: string | Record<string, unknown> | Array<Record<string, unknown>>;
}

export class BaseDAO<T extends SoftDeleteDocument> {
  private readonly softDeleteEnabled: boolean;

  constructor(protected readonly model: Model<T>) {
    this.softDeleteEnabled = Boolean(this.model.schema.path('isDeleted'));
  }

  private withNotDeleted(filter: FilterQuery<T>): FilterQuery<T> {
    if (!this.softDeleteEnabled) {
      return filter;
    }

    return {
      ...filter,
      isDeleted: { $ne: true },
    } as FilterQuery<T>;
  }

  async create(doc: Partial<T>): Promise<HydratedDocument<T>> {
    return this.model.create(doc);
  }

  async createMany(docs: Partial<T>[]): Promise<HydratedDocument<T>[]> {
    return this.model.insertMany(docs) as Promise<HydratedDocument<T>[]>;
  }

  async findById(
    id: string,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<HydratedDocument<T> | null> {
    return this.model.findOne({ _id: id, ...this.withNotDeleted({} as FilterQuery<T>) }, projection, options).exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<HydratedDocument<T> | null> {
    return this.model.findOne(this.withNotDeleted(filter), projection, options).exec();
  }

  async find(
    filter: FilterQuery<T> = {},
    projection?: ProjectionType<T>,
    options?: QueryOptions<T>,
  ): Promise<HydratedDocument<T>[]> {
    return this.model.find(this.withNotDeleted(filter), projection, options).exec();
  }

  async updateById(id: string, update: UpdateQuery<T>, options?: QueryOptions<T>) {
    const hasOperator = update && typeof update === 'object' && Object.keys(update as any).some((k) => String(k).startsWith('$'));
    const updatePayload = hasOperator ? update : ({ $set: update } as UpdateQuery<T>);

    return this.model
      .findOneAndUpdate(
        { _id: id, ...this.withNotDeleted({} as FilterQuery<T>) },
        updatePayload,
        { new: true, ...options },
      )
      .exec();
  }

  async updateOne(filter: FilterQuery<T>, update: UpdateQuery<T>, options?: QueryOptions<T>) {
    const hasOperator = update && typeof update === 'object' && Object.keys(update as any).some((k) => String(k).startsWith('$'));
    const updatePayload = hasOperator ? update : ({ $set: update } as UpdateQuery<T>);

    return this.model
      .findOneAndUpdate(this.withNotDeleted(filter), updatePayload, { new: true, ...options })
      .exec();
  }

  async deleteById(id: string, options?: QueryOptions<T>) {
    if (this.softDeleteEnabled) {
      return this.model
        .findOneAndUpdate(
          { _id: id, ...this.withNotDeleted({} as FilterQuery<T>) },
          { isDeleted: true, deletedAt: new Date() } as UpdateQuery<T>,
          { new: true, ...options },
        )
        .exec();
    }
    return this.model.findByIdAndDelete(id, options).exec();
  }

  async paginate(
    filter: FilterQuery<T> = {},
    options: PaginateOptions<T> = {},
  ): Promise<PaginationResult<HydratedDocument<T>>> {
    const { skip, limit, page } = buildPagination(options);
    const query = this.model.find(this.withNotDeleted(filter));

    if (options.select) {
      query.select(options.select);
    }

    if (options.sort) {
      query.sort(options.sort);
    }

    if (options.populate) {
      query.populate(options.populate as never);
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

  async aggregate(pipeline: PipelineStage[]) {
    return this.model.aggregate(pipeline).exec();
  }

  async count(filter: FilterQuery<T> = {}) {
    return this.model.countDocuments(this.withNotDeleted(filter)).exec();
  }
}

