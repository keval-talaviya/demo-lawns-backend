"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileService = exports.uploadImage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const sharp_1 = __importDefault(require("sharp"));
const xlsx_1 = __importDefault(require("xlsx"));
const pdfkit_1 = __importDefault(require("pdfkit"));
const config_1 = require("../config");
const logger_1 = require("../common/logger");
const uploadDir = path_1.default.resolve(process.cwd(), config_1.config.fileUploadPath);
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});
exports.uploadImage = (0, multer_1.default)({ storage });
class FileService {
    static async resizeImage(filePath, width, height) {
        const parsed = path_1.default.parse(filePath);
        const output = path_1.default.join(parsed.dir, `${parsed.name}-${width}x${height}${parsed.ext}`);
        await (0, sharp_1.default)(filePath).resize(width, height).toFile(output);
        return output;
    }
    static async uploadToS3(_filePath) {
        logger_1.logger.warn('uploadToS3 not implemented. Configure AWS SDK to enable.');
        return Promise.resolve('');
    }
    static exportToExcel(data, sheetName = 'Sheet1') {
        const workbook = xlsx_1.default.utils.book_new();
        const worksheet = xlsx_1.default.utils.json_to_sheet(data);
        xlsx_1.default.utils.book_append_sheet(workbook, worksheet, sheetName);
        return workbook;
    }
    static async generatePDF(content, fileName = `report-${Date.now()}.pdf`) {
        const filePath = path_1.default.join(uploadDir, fileName);
        return new Promise((resolve, reject) => {
            const doc = new pdfkit_1.default();
            const stream = fs_1.default.createWriteStream(filePath);
            doc.pipe(stream);
            doc.text(content);
            doc.end();
            stream.on('finish', () => resolve(filePath));
            stream.on('error', (error) => {
                logger_1.logger.error('PDF generation failed', { error });
                reject(error);
            });
        });
    }
    static removeFile(filePath) {
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
    }
}
exports.FileService = FileService;
//# sourceMappingURL=file.service.js.map