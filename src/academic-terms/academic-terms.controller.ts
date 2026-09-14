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
import { AcademicTermsService } from './academic-terms.service';
import { CreateAcademicTermDto } from './dto/create-term.dto';
import { UpdateAcademicTermDto } from './dto/update-term.dto';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Academic Terms')
@ApiBearerAuth('bearer-jwt')
@Controller('academic-terms')
export class AcademicTermsController {
  constructor(private readonly termsService: AcademicTermsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Create a new academic term/semester (Admin/Registrar only)' })
  @ApiResponse({ status: 201, description: 'Academic term created successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized roles' })
  @ApiResponse({ status: 409, description: 'Academic term already exists' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  create(@Body() createTermDto: CreateAcademicTermDto) {
    return this.termsService.create(createTermDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all academic terms' })
  @ApiResponse({ status: 200, description: 'Academic terms retrieved successfully' })
  findAll() {
    return this.termsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an academic term by ID' })
  @ApiResponse({ status: 200, description: 'Academic term details retrieved' })
  @ApiResponse({ status: 404, description: 'Academic term not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.termsService.findOne(id);
  }

  @Put(':id')
  @Roles(Role.ADMIN, Role.REGISTRAR)
  @ApiOperation({ summary: 'Update an academic term (Admin/Registrar only)' })
  @ApiResponse({ status: 200, description: 'Academic term updated successfully' })
  @ApiResponse({ status: 404, description: 'Academic term not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTermDto: UpdateAcademicTermDto,
  ) {
    return this.termsService.update(id, updateTermDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete an academic term (Admin only)' })
  @ApiResponse({ status: 200, description: 'Academic term deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden for unauthorized roles' })
  @ApiResponse({ status: 404, description: 'Academic term not found' })
  @ApiResponse({ status: 409, description: 'Conflict: active offerings exist' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.termsService.remove(id);
  }
}
