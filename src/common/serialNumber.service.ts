import mongoose from 'mongoose';

// ===============================
// 📘 Serial Number Generation Service
// ===============================

interface SerialNumberConfig {
  prefix: string;
  postfix?: string;
  padding?: number; // Number of digits for serial number
  model: mongoose.Model<any>;
  fieldName?: string; // Field name to check for existing codes (default: 'uniqueCode')
}

class SerialNumberServiceClass {
  /**
   * Generate a unique serial number with prefix and postfix
   * Format: {prefix}{serialNumber}{postfix}
   * Example: FR-0001, CUST-0001-2025, etc.
   */
  async generateUniqueCode(config: SerialNumberConfig): Promise<string> {
    const {
      prefix,
      postfix = '',
      padding = 4,
      model,
      fieldName = 'uniqueCode',
    } = config;

    // Find the latest document to get the highest serial number
    const latestDoc = await model
      .findOne({
        [fieldName]: { $regex: `^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` },
      })
      .sort({ [fieldName]: -1 })
      .select(fieldName)
      .lean() as Record<string, any> | null;

    let nextSerial = 1;

    if (latestDoc && latestDoc[fieldName]) {
      // Extract the serial number from the latest code
      const latestCode = latestDoc[fieldName] as string;
      // Remove prefix and postfix to get just the number
      const codeWithoutPrefix = latestCode.replace(new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '');
      const codeWithoutPostfix = postfix ? codeWithoutPrefix.replace(new RegExp(`${postfix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`), '') : codeWithoutPrefix;
      const serialMatch = codeWithoutPostfix.match(/\d+/);
      
      if (serialMatch) {
        const latestSerial = parseInt(serialMatch[0], 10);
        nextSerial = latestSerial + 1;
      }
    }

    // Format the serial number with padding
    const serialNumber = nextSerial.toString().padStart(padding, '0');
    
    // Generate the unique code
    const uniqueCode = `${prefix}${serialNumber}${postfix}`;

    // Ensure uniqueness (in case of race conditions)
    const exists = await model.findOne({ [fieldName]: uniqueCode });
    if (exists) {
      // If exists, recursively try with next number
      return this.generateUniqueCode({
        ...config,
      });
    }

    return uniqueCode;
  }

  /**
   * Generate serial number with year/month suffix
   * Format: {prefix}{serialNumber}-{YYYYMM}{postfix}
   */
  async generateUniqueCodeWithDate(config: SerialNumberConfig): Promise<string> {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    const datePostfix = config.postfix ? `-${yearMonth}${config.postfix}` : `-${yearMonth}`;
    
    return this.generateUniqueCode({
      ...config,
      postfix: datePostfix,
    });
  }
}

export const SerialNumberService = new SerialNumberServiceClass();

