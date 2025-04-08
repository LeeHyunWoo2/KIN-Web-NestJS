import jwt, {JwtPayload} from "jsonwebtoken";
import { deleteRefreshTokenFromRedis, invalidateAccessToken } from "@/services/auth/tokenService";
import {FindUserDataRequestDto} from "@/types/dto/user/user.request.dto";
import {Request, Response} from "express";
import {
  addLocalAccount,
  getUserById,
  deleteUserById,
  getUserByQuery,
  getUserPublicProfile,
  resetPassword,
  updateUser
} from "@/services/user/userService";
import {createHttpError} from "@/utils/createHttpError";
import {sendFormattedError} from "@/utils/sendFormattedError";
import {CustomError} from "@/types/CustomError";
import {PublicUserDataResponseDto, UserInfoResponseDto} from "@/types/dto/user/user.response.dto";
import {FindUserQuery, FindUserQueryData, UpdateUserProfileData} from "@/types/User";
import {logError} from "@/utils/logError";

export const getUserPublicProfileController = async (
    req: Request,
    res: Response<PublicUserDataResponseDto>
):Promise<void> => {
  try {
    const publicProfile = await getUserPublicProfile(req.user?.id as string);
    res.status(200).json(publicProfile);
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "프로필 조회 실패");
  }
};

export const getUserInfoController = async (
    req: Request,
    res: Response<UserInfoResponseDto>
):Promise<void> => {
  try {
    const user = await getUserById(req.user?.id as string);
    res.status(200).json({ user });
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "사용자 정보 조회 중 오류가 발생했습니다.");
  }
};

//이메일 중복확인 및 아이디 비번 찾기
export const getUserByInputController = async (
    req: Request<{}, {}, FindUserDataRequestDto>,
    res: Response
): Promise<void> => {
  try{
    const {input, inputType, fetchUsername}= req.body;

    const query: FindUserQuery = { input, inputType };
    const user: FindUserQueryData = await getUserByQuery(query);

    let checkAccountType;

    const hasLocalAccount = user.socialAccounts.some(account => account.provider === 'local');
    if (!hasLocalAccount) {
       checkAccountType = "SNS";
    } else {
       checkAccountType = "Local";
    }
    if(fetchUsername){
      res.status(200).json({signal: 'user_found', accountType: checkAccountType, username: user.username});
    } else {
      res.status(200).json({signal: 'user_found', accountType: checkAccountType, email: user.email});
    }
  } catch {
    // 못 찾은게 서버측에서는 에러지만 로직상으로는 없는게 확인된것(성공)이기 때문에 200 코드와 플래그 반환
    res.status(200).json({signal: 'user_not_found'});
  }
}

export const updateUserInfoController = async (
    req: Request,
    res: Response
):Promise<void> => {
  try {
    const userId = req.user?.id as string;
    // 테스트 계정 ID 배열
    const testAccountIds = ['672ae1ad9595d29f7bfbf34a', '672ae28b9595d29f7bfbf353'];
    if (testAccountIds.includes(userId)){
      throw createHttpError(418, '테스트 계정은 변경할 수 없습니다.');
    }
    const { name, profileIcon } = req.body as UpdateUserProfileData;
    const updatedUser = await updateUser(userId, { name, profileIcon });
    res.status(200).json({user: updatedUser});
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "사용자 정보 수정 중 오류가 발생했습니다.");
  }
};

// 비밀번호 변경
export const resetPasswordController = async (
    req: Request,
    res: Response
):Promise<void> => {
  try {
    const { newPassword, email } = req.body;
    await resetPassword(newPassword, email);
    res.status(200).json({ message: "비밀번호가 성공적으로 변경되었습니다." });
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "비밀번호 변경 중 오류가 발생했습니다.");
  }
};

// 로컬 계정 추가 (소셜 Only 계정용)
export const addLocalAccountController = async (
    req: Request,
    res: Response
):Promise<void> => {
  try {
    const { username, email, password } = req.body;
    await addLocalAccount(req.user?.id as string, username, email, password);
    res.status(200).json();
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "로컬 계정 추가 중 오류가 발생했습니다.");
  }
};

export const deleteUserController = async (
    req: Request,
    res: Response
):Promise<void> => {
  try {
    const userId = req.user?.id as string;
    const { accessToken, refreshToken } = req.cookies;

    if (refreshToken) {
      const decoded = jwt.decode(refreshToken) as JwtPayload;
      await deleteRefreshTokenFromRedis(decoded.id);
    }

    if (accessToken) {
      await invalidateAccessToken(accessToken);
    }
    // 테스트 계정 ID 배열
    const testAccountIds = ['672ae1ad9595d29f7bfbf34a', '672ae28b9595d29f7bfbf353'];
    if (testAccountIds.includes(userId)){
      throw createHttpError(418, '테스트 계정은 변경할 수 없습니다.');
    }
    await deleteUserById(userId);
    res.clearCookie('accessToken', { httpOnly: true,  domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined  });
    res.clearCookie('refreshToken', { httpOnly: true,  domain: process.env.NODE_ENV === 'production' ? 'noteapp.org' : undefined  });

    res.status(200).json();
  } catch (error) {
    logError(error, req);
    sendFormattedError(res, error as CustomError, "회원 탈퇴 중 오류가 발생했습니다.");
  }
};