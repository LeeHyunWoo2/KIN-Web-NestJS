import schedule from 'node-schedule';
import { backupDatabase } from './notes/backupService';

schedule.scheduleJob('0 0 * * *', () => {
  console.log('백업 실행 : ', new Date());
  backupDatabase().then();
});