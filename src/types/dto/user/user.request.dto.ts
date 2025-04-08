// 아이디 찾기, 비밀번호 찾기 input : 'id', 'email'
import {FindUserQuery} from "@/types/User";

export interface FindUserDataRequestDto extends FindUserQuery{
  fetchUsername: boolean;
}