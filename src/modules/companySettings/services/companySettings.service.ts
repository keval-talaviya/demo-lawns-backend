import { CompanySettingsModel, CompanySettingsDocument } from '../model/companySettings.model';
import { Types, FlattenMaps } from 'mongoose';

export class CompanySettingsService {
    /**
     * Create company settings
     */
    static async create(data: {
        companyName: string;
        companyLogo?: string;
        gstNumber: string;
        gstRate: number;
        createdBy: Types.ObjectId;
    }): Promise<CompanySettingsDocument> {
        const settings = new CompanySettingsModel({
            ...data,
            updatedBy: data.createdBy,
        });
        return await settings.save();
    }

    /**
     * Get company settings (should only be one record)
     */
    static async get(): Promise<FlattenMaps<CompanySettingsDocument> | null> {
        return await CompanySettingsModel.findOne().lean();
    }

    /**
     * Update company settings
     */
    static async update(
        id: string,
        data: Partial<{
            companyName: string;
            companyLogo: string;
            gstNumber: string;
            gstRate: number;
            updatedBy: Types.ObjectId;
        }>
    ): Promise<CompanySettingsDocument | null> {
        return await CompanySettingsModel.findByIdAndUpdate(
            id,
            { $set: data },
            { new: true, runValidators: true }
        );
    }

    /**
     * Check if company settings exist
     */
    static async exists(): Promise<boolean> {
        const count = await CompanySettingsModel.countDocuments();
        return count > 0;
    }

    /**
     * Find by ID
     */
    static async findById(id: string): Promise<FlattenMaps<CompanySettingsDocument> | null> {
        return await CompanySettingsModel.findById(id).lean();
    }
}
