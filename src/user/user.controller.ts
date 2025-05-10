import { Body, Controller, Delete, Get, Post, Put, Req, Res, UseGuards } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

import { AccessGuard } from '@/auth/access.guard';
import { DecodedUser } from '@/auth/types/auth-service.types';
import { CurrentUserDecorator } from '@/common/decorators/current-user.decorator';
import { RefreshToken } from '@/common/decorators/refresh-token.decorator';
import { ResetPasswordDto } from '@/user/dto/user-auth.dto';
import {
  AddLocalAccountDto,
  PublicUserProfileDto,
  UpdateUserDto,
  UserInfoResponseDto,
} from '@/user/dto/user-profile.dto';
import { FindUserDto, FindUserResultDto } from '@/user/dto/user-search.dto';
import {
  AddLocalAccountInput,
  DeleteUserInput,
  ResetPasswordInput,
  UpdateUserInput,
} from '@/user/types/user-service.types';
import { UserService } from '@/user/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AccessGuard)
  async getPublicUserProfile(
    @CurrentUserDecorator() user: DecodedUser,
  ): Promise<PublicUserProfileDto> {
    return this.userService.getPublicProfile(user.id);
  }

  @Post()
  @UseGuards(AccessGuard)
  async getUserInfo(@CurrentUserDecorator() user: DecodedUser): Promise<UserInfoResponseDto> {
    return this.userService.getUserInfo(user.id);
  }

  @Put()
  @UseGuards(AccessGuard)
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
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<void> {
    const input: ResetPasswordInput = {
      email: resetPasswordDto.email,
      newPassword: resetPasswordDto.newPassword,
    };
    return this.userService.resetPassword(input);
  }

  @Post('find')
  async findUserByInput(@Body() findUserDto: FindUserDto): Promise<FindUserResultDto> {
    return this.userService.findUserByInput(findUserDto);
  }

  @Post('change-local')
  @UseGuards(AccessGuard)
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
