import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth('bearer-jwt')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'List user accounts with search, role/status filters, and pagination' })
  @ApiQuery({ name: 'role', required: false, enum: Role })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE'] })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized roles' })
  findAll(@Query() query: QueryUsersDto) {
    return this.usersService.findAll(query);
  }

  @Get('instructors')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'List active instructors available for course offering assignment' })
  @ApiResponse({ status: 200, description: 'Instructors retrieved successfully' })
  findInstructors() {
    return this.usersService.findInstructors();
  }

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a user account with an assigned role (Admin only)' })
  @ApiResponse({ status: 201, description: 'User account created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admin roles' })
  @ApiResponse({ status: 409, description: 'Email already exists or student already linked' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update name, email, role, account status, or password (Admin only)' })
  @ApiResponse({ status: 200, description: 'User account updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: cannot modify own role or status' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already exists or student already linked' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() currentUser: any,
  ) {
    return this.usersService.update(id, updateUserDto, currentUser);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete a user account (Admin only, blocked when assigned to offerings)' })
  @ApiResponse({ status: 200, description: 'User account deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admin roles or own account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User is assigned to course offerings' })
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() currentUser: any) {
    return this.usersService.remove(id, currentUser);
  }
}
