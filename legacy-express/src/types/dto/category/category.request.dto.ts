export interface CreateAndUpdateCategoryRequestDto {
  name: string;
  parent_id?: string;
}

export interface DeleteCategoryRequestDto {
  categoryIds: string[];
  noteIds: string[];
}