"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const CategorySchema = new mongoose_1.Schema({
    user_id: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User', // 사용자 참조
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    parent_id: {
        type: mongoose_1.Schema.Types.ObjectId, // 상위 카테고리
        ref: 'Category',
        required: false,
    }
}, {
    versionKey: false // __v 필드 비활성화
});
exports.default = mongoose_1.models.Category || (0, mongoose_1.model)("Category", CategorySchema);
