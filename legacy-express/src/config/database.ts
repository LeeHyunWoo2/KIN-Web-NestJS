// db 연결 설정 처리
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI 환경 변수가 설정되지 않았습니다.');
    }
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB 연결 성공');
  } catch (error) {
    console.error('MongoDB 연결 실패:', error);
    process.exit(1);
    // 연결 실패 시 프로세스 종료
  }
};