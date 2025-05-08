import { Body, Controller, Delete, Get, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { RefreshToken } from '@/common/decorators/refresh-token.decorator';
import { DecodedUser } from '@/types/user.types';
import { ResetPasswordDto } from '@/user/dto/user-auth.dto';
import {
  AddLocalAccountDto,
  PublicUserProfileDto,
  UpdateUserDto,
  UserInfoResponseDto,
} from '@/user/dto/user-profile.dto';
import { FindUserDto, FindUserResultDto } from '@/user/dto/user-search.dto';
import { UserService } from '@/user/user.service';

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
  async updateUser(
    @CurrentUserDecorator() user: DecodedUser,
    @Body() updatedData: UpdateUserDto,
  ): Promise<Partial<PublicUserProfileDto>> {
    return this.userService.updateUser(user.id, updatedData);
  }

  @Put('password')
  @ApiOperation({ summary: '비밀번호 재설정 (비밀번호 찾기 후 사용)' })
  @ApiResponse({
    status: 200,
    description: '비밀번호 재설정 성공 (응답 본문 없음)',
  })
  @ApiResponse({
    status: 400,
    description: '기존과 동일한 비밀번호 또는 재사용된 비밀번호',
  })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    return this.userService.resetPassword(body.newPassword, body.email);
  }

  @Post('find')
  @ApiOperation({ summary: '아이디 / 비밀번호 찾기 또는 중복 확인' })
  @ApiResponse({
    status: 200,
    description: '유저 존재 여부 및 관련 정보 반환',
    type: FindUserResultDto,
  })
  async findUserByInput(@Body() dto: FindUserDto): Promise<FindUserResultDto> {
    return this.userService.findUserByInput(dto);
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
  })
  async addLocalAccount(
    @CurrentUserDecorator() user: DecodedUser,
    @Body() dto: AddLocalAccountDto,
  ): Promise<void> {
    return this.userService.addLocalAccount(user.id, dto.username, dto.email, dto.password);
  }

  @Delete()
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiResponse({
    status: 200,
    description: '탈퇴 성공 (쿠키 제거, 응답 본문 없음)',
  })
  async deleteUser(
    @CurrentUserDecorator() user: DecodedUser,
    @Req() req: FastifyRequest,
    @RefreshToken() refreshToken: string,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { accessToken } = req.cookies;
    await this.userService.deleteUser(user.id, accessToken, refreshToken);
    reply.clearCookie('accessToken');
    reply.clearCookie('refreshToken');
  }
}
