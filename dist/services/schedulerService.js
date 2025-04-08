"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_schedule_1 = __importDefault(require("node-schedule"));
const backupService_1 = require("./notes/backupService");
node_schedule_1.default.scheduleJob('0 0 * * *', () => {
    console.log('백업 실행 : ', new Date());
    (0, backupService_1.backupDatabase)().then();
});
