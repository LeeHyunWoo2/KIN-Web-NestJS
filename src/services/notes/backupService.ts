require('dotenv').config();
import fs from 'fs';
import path from 'path';
import { google } from 'googleapis';
import mongoose from 'mongoose';
import Note from '../../models/note';
import User from '../../models/user';
import Category from '../../models/category';
import Tag from '../../models/tag';

// 백업 관련 설정
const BACKUP_PATH = process.env.BACKUP_DIRECTORY || path.join(__dirname, '../../../backups');
const MONGO_URI = process.env.MONGO_URI;
const BACKUP_RETENTION_DAYS = 7;

// 디렉토리 확인 및 생성
if (!fs.existsSync(BACKUP_PATH)) {
  fs.mkdirSync(BACKUP_PATH, { recursive: true });
}

// 구글 드라이브 API 설정
const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
const auth = new google.auth.GoogleAuth({
  credentials: serviceAccountKey,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });


// 구글 드라이브 하위 폴더 생성
const createGoogleDriveFolder = async (parentFolderId, folderName) => {
  try {
    const response = await drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentFolderId],
      },
      fields: 'id',
    });
    console.log(`구글 드라이브 폴더 생성: ${folderName} (${response.data.id})`);
    return response.data.id;
  } catch (error) {
    console.error(`구글 드라이브 폴더 생성 실패 (${folderName}):`, error.message);
    throw error;
  }
};

// 구글 드라이브 하위 폴더 확인, 없으면 생성
const getOrCreateGoogleDriveFolder = async (parentFolderId, folderName) => {
  try {
    const response = await drive.files.list({
      q: `'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name)',
    });

    if (response.data.files.length > 0) {
      console.log(`구글 드라이브 폴더 확인: ${folderName} (${response.data.files[0].id})`);
      return response.data.files[0].id;
    }
    
    return await createGoogleDriveFolder(parentFolderId, folderName);
  } catch (error) {
    console.error(`구글 드라이브 폴더 확인 실패 (${folderName}):`, error.message);
    throw error;
  }
};


//오래된 백업 파일 정리
const cleanupOldBackups = async (folderPath, googleDriveFolderId) => {
  // 로컬 백업 정리
  const files = fs.readdirSync(folderPath).filter((file) => file.endsWith('.json'));
  files.sort().slice(0, -BACKUP_RETENTION_DAYS).forEach((file) => {
    const filePath = path.join(folderPath, file);
    fs.unlinkSync(filePath);
    console.log(`로컬 백업 삭제: ${filePath}`);
  });

  // 구글 드라이브 백업 정리 (google drive v3 api 참고)
  const response = await drive.files.list({
    q: `'${googleDriveFolderId}' in parents and mimeType='application/json'`,
    fields: 'files(id, name, createdTime)',
    orderBy: 'createdTime',
  });

  const googleDriveFiles = response.data.files;
  if (googleDriveFiles.length > BACKUP_RETENTION_DAYS) {
    const filesToDelete = googleDriveFiles.slice(0, googleDriveFiles.length - BACKUP_RETENTION_DAYS);
    for (const file of filesToDelete) {
      await drive.files.delete({ fileId: file.id });
      console.log(`${BACKUP_RETENTION_DAYS} 일 지난 구글 드라이브 백업 삭제: ${file.name} (${file.id})`);
    }
  }
};

// 구글 드라이브 파일 업로드
const uploadToGoogleDrive = async (filePath, folderId) => {
  try {
    const fileMetadata = {
      name: path.basename(filePath),
      parents: [folderId],
    };

    const media = {
      mimeType: 'application/json',
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: 'id',
    });

    console.log(`구글 드라이브 업로드 성공: ${response.data.id}`);
  } catch (error) {
    console.error('구글 드라이브 업로드 실패:', error.message);
  }
};

// DB 백업 실행
const backupDatabase = async () => {
  // 기존 연결과 겹치지 않도록 별도의 MongoDB 연결 인스턴스 생성
  const backupConnection = mongoose.createConnection(MONGO_URI);

  try {
    console.log('백업용 MongoDB 연결 성공');
    const date = new Date(Date.now())
    .toISOString()
    .replace(/T/, '_')
    .replace(/:/g, '-')
    .split('.')[0];

    // 모델별로 로컬 및 구글 드라이브 폴더 생성 및 백업
    const models = { Note, User, Category, Tag };
    for (const [name, model] of Object.entries(models)) {
      const localFolderPath = path.join(BACKUP_PATH, name);
      if (!fs.existsSync(localFolderPath)) {
        fs.mkdirSync(localFolderPath, { recursive: true });
      }

      const googleDriveFolderId = await getOrCreateGoogleDriveFolder(process.env.GOOGLE_DRIVE_FOLDER_ID, name);

      const data = await backupConnection.model(name, model.schema).find().lean();
      const backupFilePath = path.join(localFolderPath, `${name}_${date}.json`);
      fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`${name} 데이터 백업 성공: ${backupFilePath}`);

      await uploadToGoogleDrive(backupFilePath, googleDriveFolderId);

      await cleanupOldBackups(localFolderPath, googleDriveFolderId);
    }
  } catch (error) {
    console.error('백업 실패:', error.message);
  } finally {
    await backupConnection.close();
    console.log('백업용 MongoDB 인스턴스 연결 종료');
  }
};

module.exports = { backupDatabase };
