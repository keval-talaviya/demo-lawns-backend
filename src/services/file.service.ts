import fs from 'fs';
import path from 'path';
import multer from 'multer';
import sharp from 'sharp';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import { config } from '../config';
import { logger } from '../common/logger';

const uploadDir = path.resolve(process.cwd(), config.fileUploadPath);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const uploadImage = multer({ storage });

export class FileService {
  static async resizeImage(filePath: string, width: number, height: number) {
    const parsed = path.parse(filePath);
    const output = path.join(parsed.dir, `${parsed.name}-${width}x${height}${parsed.ext}`);
    await sharp(filePath).resize(width, height).toFile(output);
    return output;
  }

  static async uploadToS3(_filePath: string) {
    logger.warn('uploadToS3 not implemented. Configure AWS SDK to enable.');
    return Promise.resolve('');
  }

  static exportToExcel<T extends Record<string, unknown>>(data: T[], sheetName = 'Sheet1') {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    return workbook;
  }

  static async generatePDF(content: string, fileName = `report-${Date.now()}.pdf`) {
    const filePath = path.join(uploadDir, fileName);
    return new Promise<string>((resolve, reject) => {
      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);

      doc.pipe(stream);
      doc.text(content);
      doc.end();

      stream.on('finish', () => resolve(filePath));
      stream.on('error', (error) => {
        logger.error('PDF generation failed', { error });
        reject(error);
      });
    });
  }

  static removeFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

