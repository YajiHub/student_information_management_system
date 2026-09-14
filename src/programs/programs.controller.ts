import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { ProgramsService } from './programs.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Programs')
@ApiBearerAuth('bearer-jwt')
@Controller('programs')
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Create a new academic program (Admin/Registrar only)' })
  @ApiResponse({ status: 201, description: 'Program created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized roles' })
  @ApiResponse({ status: 409, description: 'Program code already exists' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programsService.create(createProgramDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all academic programs' })
  @ApiResponse({ status: 200, description: 'Programs retrieved successfully' })
  findAll() {
    return this.programsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an academic program by ID' })
  @ApiResponse({ status: 200, description: 'Program details retrieved' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Update an academic program (Admin/Registrar only)' })
  @ApiResponse({ status: 200, description: 'Program updated successfully' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProgramDto: UpdateProgramDto,
  ) {
    return this.programsService.update(id, updateProgramDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an academic program (Admin only)' })
  @ApiResponse({ status: 200, description: 'Program deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized roles' })
  @ApiResponse({ status: 404, description: 'Program not found' })
  @ApiResponse({ status: 409, description: 'Conflict: associated students exist' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.programsService.remove(id);
  }
}
