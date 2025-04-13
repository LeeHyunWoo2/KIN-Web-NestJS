import { Body, Controller, Delete, Get, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AuthGuard } from '@/auth/auth.guard';
import { CatchAndLog } from '@/common/decorators/catch-and-log.decorator';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { DecodedUser } from '@/types/user.types';
import { FindUserDto } from '@/user/dto/find-user.dto';
import {
  FindUserFailureResponseDto,
  FindUserSuccessResponseDto,
} from '@/user/dto/find-user-response';
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
  @UseGuards(AuthGuard)
  @CatchAndLog()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'public 유저 데이터 (프로필 표시용)' })
  @ApiResponse({ status: 200, type: PublicUserProfileDto })
  async getPublicUserProfile(
    @CurrentUserDecorator() user: DecodedUser,
  ): Promise<PublicUserProfileDto> {
    return this.userService.getPublicProfile(user.id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @CatchAndLog()
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그인된 유저의 전체 정보 조회' })
  @ApiResponse({ status: 200, type: UserInfoResponseDto })
  async getUserInfo(@CurrentUserDecorator() user: DecodedUser) {
    return this.userService.getUserInfo(user.id);
  }

  @Put()
  @UseGuards(AuthGuard)
  @CatchAndLog()
  @ApiBearerAuth()
  @ApiOperation({ summary: '유저 정보 수정 (이름, 프로필 아이콘)' })
  async updateUser(
    @CurrentUserDecorator() user: DecodedUser,
    @Body() updatedData: UpdateUserDto,
  ): Promise<Partial<PublicUserProfileDto>> {
    return this.userService.updateUser(user.id, updatedData);
  }

  @Put('password')
  @CatchAndLog()
  @ApiOperation({ summary: '비밀번호 재설정 (비밀번호 찾기 후 사용)' })
  async resetPassword(@Body() body: ResetPasswordDto): Promise<void> {
    return this.userService.resetPassword(body.newPassword, body.email);
  }

  @Post('find')
  @CatchAndLog()
  @ApiOperation({ summary: '아이디 / 비밀번호 찾기 또는 중복 확인' })
  @ApiResponse({ status: 200, type: FindUserSuccessResponseDto, description: '유저를 찾은 경우' })
  @ApiResponse({
    status: 200,
    type: FindUserFailureResponseDto,
    description: '유저를 찾지 못한 경우',
  })
  async findUserByInput(
    @Body() body: FindUserDto,
  ): Promise<FindUserSuccessResponseDto | FindUserFailureResponseDto> {
    return this.userService.findUserByInput(body);
  }

  @Post('change-local')
  @UseGuards(AuthGuard)
  @CatchAndLog()
  async addLocalAccount(
    @CurrentUserDecorator() user: DecodedUser,
    @Body() body: { username: string; email: string; password: string },
  ): Promise<void> {
    return this.userService.addLocalAccount(user.id, body.username, body.email, body.password);
  }

  @Delete()
  @UseGuards(AuthGuard)
  @CatchAndLog()
  async deleteUser(
    @CurrentUserDecorator() user: DecodedUser,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { accessToken, refreshToken } = req.cookies;
    await this.userService.deleteUser(user.id, accessToken, refreshToken);
    reply.clearCookie('accessToken');
    reply.clearCookie('refreshToken');
  }
}
