"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectMongo = exports.connectMongo = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("../config");
const logger_1 = require("../common/logger");
mongoose_1.default.set('strictQuery', true);
const connectMongo = async () => {
    if (mongoose_1.default.connection.readyState === 1) {
        return mongoose_1.default;
    }
    const connection = await mongoose_1.default.connect(config_1.config.mongoUri);
    logger_1.logger.info('Connected to MongoDB');
    return connection;
};
exports.connectMongo = connectMongo;
const disconnectMongo = async () => {
    await mongoose_1.default.disconnect();
    logger_1.logger.info('Disconnected from MongoDB');
};
exports.disconnectMongo = disconnectMongo;
//# sourceMappingURL=mongoose.js.map