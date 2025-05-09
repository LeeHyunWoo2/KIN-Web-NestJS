import { Body, Controller, Delete, Get, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExtraModels, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { RefreshToken } from '@/common/decorators/refresh-token.decorator';
import {
  AlreadyHasLocalAccountException,
  PasswordReusedException,
  SamePasswordUsedException,
  TestAccountMutationException,
  UserNotFoundException,
} from '@/common/exceptions';
import {
  AddLocalAccountInput,
  DecodedUser,
  DeleteUserInput,
  ResetPasswordInput,
  UpdateUserInput,
} from '@/types/user.types';
import { ResetPasswordDto } from '@/user/dto/user-auth.dto';
import {
  AddLocalAccountDto,
  PublicUserProfileDto,
  UpdateUserDto,
  UserInfoResponseDto,
} from '@/user/dto/user-profile.dto';
import { FindUserDto, FindUserResultDto } from '@/user/dto/user-search.dto';
import { UserService } from '@/user/user.service';

@ApiExtraModels(
  UserNotFoundException,
  SamePasswordUsedException,
  PasswordReusedException,
  AlreadyHasLocalAccountException,
  TestAccountMutationException,
)
@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'public 유저 데이터 (프로필 표시용)' })
  @ApiResponse({
    status: 200,
    description: '유저 공개 프로필 반환',
    type: PublicUserProfileDto,
  })
  @ApiResponse({
    status: 404,
    description: '유저를 찾을 수 없음',
    type: UserNotFoundException,
  })
  async getPublicUserProfile(
    @CurrentUserDecorator() user: DecodedUser,
  ): Promise<PublicUserProfileDto> {
    return this.userService.getPublicProfile(user.id);
  }

  @Post()
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그인된 유저의 전체 정보 조회' })
  @ApiResponse({
    status: 200,
    description: '유저 전체 정보 반환',
    type: UserInfoResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '유저를 찾을 수 없음',
    type: UserNotFoundException,
  })
  async getUserInfo(@CurrentUserDecorator() user: DecodedUser): Promise<UserInfoResponseDto> {
    return this.userService.getUserInfo(user.id);
  }

  @Put()
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저 정보 수정 (닉네임, 프로필 이미지)' })
  @ApiResponse({
    status: 200,
    description: '업데이트된 유저 프로필 반환',
    schema: {
      example: {
        name: 'mr.john2',
        profileIcon: 'https://img.example.com/new.jpg',
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '테스트 계정은 변경할 수 없음',
    type: TestAccountMutationException,
  })
  @ApiResponse({
    status: 404,
    description: '유저를 찾을 수 없음',
    type: UserNotFoundException,
  })
  async updateUser(
    @CurrentUserDecorator() user: DecodedUser,
    @Body() updatedData: UpdateUserDto,
  ): Promise<Partial<PublicUserProfileDto>> {
    const input: UpdateUserInput = {
      id: user.id,
      data: updatedData,
    };
    return this.userService.updateUser(input);
  }

  @Put('password')
  @ApiOperation({ summary: '비밀번호 재설정 (비밀번호 찾기 후 사용)' })
  @ApiResponse({
    status: 200,
    description: '비밀번호 재설정 성공 (응답 본문 없음)',
  })
  @ApiResponse({
    status: 400,
    description: '기존과 동일한 비밀번호',
    type: SamePasswordUsedException,
  })
  @ApiResponse({
    status: 400,
    description: '최근 사용된 비밀번호 재사용',
    type: PasswordReusedException,
  })
  @ApiResponse({
    status: 404,
    description: '유저를 찾을 수 없음',
    type: UserNotFoundException,
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void> {
    const input: ResetPasswordInput = {
      email: resetPasswordDto.email,
      newPassword: resetPasswordDto.newPassword,
    };
    return this.userService.resetPassword(input);
  }

  @Post('find')
  @ApiOperation({ summary: '아이디 / 비밀번호 찾기 또는 중복 확인' })
  @ApiResponse({
    status: 200,
    description: '유저 존재 여부 및 관련 정보 반환',
    type: FindUserResultDto,
  })
  async findUserByInput(@Body() findUserDto: FindUserDto): Promise<FindUserResultDto> {
    return this.userService.findUserByInput(findUserDto);
  }

  @Post('change-local')
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '소셜 유저의 로컬 계정 정보 추가' })
  @ApiResponse({
    status: 200,
    description: '로컬 계정 추가 성공 (응답 본문 없음)',
  })
  @ApiResponse({
    status: 409,
    description: '이미 로컬 계정이 존재함',
    type: AlreadyHasLocalAccountException,
  })
  @ApiResponse({
    status: 404,
    description: '유저를 찾을 수 없음',
    type: UserNotFoundException,
  })
  async addLocalAccount(
    @CurrentUserDecorator() user: DecodedUser,
    @Body() dto: AddLocalAccountDto,
  ): Promise<void> {
    const input: AddLocalAccountInput = {
      id: user.id,
      username: dto.username,
      email: dto.email,
      password: dto.password,
    };
    return this.userService.addLocalAccount(input);
  }

  @Delete()
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({
    status: 200,
    description: '탈퇴 성공 (쿠키 제거, 응답 본문 없음)',
  })
  @ApiResponse({
    status: 403,
    description: '테스트 계정은 삭제할 수 없음',
    type: TestAccountMutationException,
  })
  async deleteUser(
    @CurrentUserDecorator() user: DecodedUser,
    @Req() req: FastifyRequest,
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { accessToken } = req.cookies;
    const input: DeleteUserInput = {
      id: user.id,
      accessToken,
      refreshToken,
    };
    await this.userService.deleteUser(input);

    reply.clearCookie('accessToken');
    reply.clearCookie('refreshToken');
  }
}
