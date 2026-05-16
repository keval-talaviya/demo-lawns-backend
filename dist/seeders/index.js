"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mongoose_1 = require("../src/db/mongoose");
const logger_1 = require("../src/common/logger");
const runSeeders = async () => {
    await (0, mongoose_1.connectMongo)();
    logger_1.logger.info('Running seeders...');
    const seedersDir = path_1.default.resolve(__dirname);
    const files = fs_1.default
        .readdirSync(seedersDir)
        .filter((file) => file.endsWith('.seed.ts') || file.endsWith('.seed.js'))
        .sort();
    for (const file of files) {
        try {
            const seederPath = path_1.default.join(seedersDir, file);
            logger_1.logger.info(`Running seeder: ${file}`);
            const seeder = await Promise.resolve(`${seederPath}`).then(s => __importStar(require(s)));
            if (seeder.run) {
                await seeder.run();
            }
            else if (typeof seeder.default === 'function') {
                await seeder.default();
            }
            logger_1.logger.info(`Completed seeder: ${file}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to run seeder ${file}`, { error });
        }
    }
    await (0, mongoose_1.disconnectMongo)();
    logger_1.logger.info('Seeders completed');
};
runSeeders().catch((error) => {
    logger_1.logger.error('Seeder error', { error });
    process.exit(1);
});
//# sourceMappingURL=index.js.map