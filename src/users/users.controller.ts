import { 
  Controller, 
  Body, Get, 
  Param, 
  ParseIntPipe, 
  Post, 
  Patch, 
  Delete, 
  UseGuards,
  Request,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@ApiBearerAuth('access-token')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiResponse({ status: 200, description: 'Retrieve all users (Admin Only)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
    findAll() {
      return this.usersService.findAll();
    }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@Request() req: any) {
    return this.usersService.findOne(
      req.user.id,
      req.user.id,
      req.user.role,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/password')
  changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      req.user.id,
      changePasswordDto,
    );
  }
  
  @ApiResponse({ status: 200, description: 'Retrieve user by ID' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(":id")
  findOne(
    @Param("id", ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.usersService.findOne(
      id,
      req.user.id,
      req.user.role
    );
  }

  @ApiResponse({ status: 201, description: 'Create a new user account (Register)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(createUserDto);
  }

  @ApiResponse({ status: 200, description: 'Update the user account' })
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    return this.usersService.update(
      id,
      updateUserDto,
      req.user.id,
      req.user.role
    );
  }

  @ApiResponse({ status: 200, description: 'Delete the user account' })
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(
    @Param("id", ParseIntPipe) id: number,
    @Request() req,
  ) {
    return this.usersService.remove(
      id,
      req.user.id,
      req.user.role
    );
  }

}
