import { Body, Controller, Delete, Get, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { DecodedUser } from '@/types/user.types';
import { FindUserResultDto } from '@/user/dto/find-result-response';
import { FindUserDto } from '@/user/dto/find-user.dto';
import { PublicUserProfileDto } from '@/user/dto/public-user-profile.dto';
import { ResetPasswordDto } from '@/user/dto/reset-password.dto';
import { UpdateUserDto } from '@/user/dto/update-user.dto';
import { UserInfoResponseDto } from '@/user/dto/user-info-response.dto';
import { UserService } from '@/user/user.service';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'public 유저 데이터 (프로필 표시용)' })
  @ApiResponse({ status: 200, type: PublicUserProfileDto })
  async getPublicUserProfile(
    @CurrentUserDecorator() user: DecodedUser,
  ): Promise<PublicUserProfileDto> {
    return this.userService.getPublicProfile(user.id);
  }

  @Post()
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그인된 유저의 전체 정보 조회' })
  @ApiResponse({ status: 200, type: UserInfoResponseDto })
  async getUserInfo(@CurrentUserDecorator() user: DecodedUser): Promise<UserInfoResponseDto> {
    return this.userService.getUserInfo(user.id);
  }

  @Put()
  @UseGuards(AccessGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저 정보 수정 (이름, 프로필 아이콘)' })
  async updateUser(
    @CurrentUserDecorator() user: DecodedUser,
    @Body() updatedData: UpdateUserDto,
  ): Promise<Partial<PublicUserProfileDto>> {
    return this.userService.updateUser(user.id, updatedData);
  }

  @Put('password')
  @ApiOperation({ summary: '비밀번호 재설정 (비밀번호 찾기 후 사용)' })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    return this.userService.resetPassword(body.newPassword, body.email);
  }

  @Post('find')
  @ApiOperation({ summary: '아이디 / 비밀번호 찾기 또는 중복 확인' })
  @ApiResponse({
    status: 200,
    type: FindUserResultDto,
    description: '유저 존재 여부 및 관련 정보 반환',
  })
  async findUserByInput(@Body() dto: FindUserDto): Promise<FindUserResultDto> {
    return this.userService.findUserByInput(dto);
  }

  @Post('change-local')
  @UseGuards(AccessGuard)
  async addLocalAccount(
    @CurrentUserDecorator() user: DecodedUser,
    @Body() body: { username: string; email: string; password: string },
  ): Promise<void> {
    return this.userService.addLocalAccount(user.id, body.username, body.email, body.password);
  }

  @Delete()
  @UseGuards(AccessGuard)
  async deleteUser(
    @CurrentUserDecorator() user: DecodedUser,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<void> {
    const { accessToken, refreshToken } = req.cookies;
    await this.userService.deleteUser(user.id, accessToken, refreshToken);
    reply.clearCookie('accessToken');
    reply.clearCookie('refreshToken');
  }
}
