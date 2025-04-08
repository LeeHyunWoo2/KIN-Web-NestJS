"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const TagSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
    },
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User', // 태그 소유자 참조
        required: true,
    },
}, {
    versionKey: false // __v 필드 비활성화
});
exports.default = mongoose_1.models.Tag || (0, mongoose_1.model)("Tag", TagSchema);
