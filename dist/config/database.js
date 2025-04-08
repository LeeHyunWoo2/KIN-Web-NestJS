"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
// db 연결 설정 처리
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI 환경 변수가 설정되지 않았습니다.');
        }
        await mongoose_1.default.connect(process.env.MONGO_URI);
        console.log('MongoDB 연결 성공');
    }
    catch (error) {
        console.error('MongoDB 연결 실패:', error);
        process.exit(1);
        // 연결 실패 시 프로세스 종료
    }
};
exports.connectDB = connectDB;
