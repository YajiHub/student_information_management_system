import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryAuditLogDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by acting user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  actor_id?: number;

  @ApiPropertyOptional({ description: 'Filter by resource segment, e.g. students' })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({ description: 'Filter by action, e.g. CREATE, UPDATE, DELETE, LOGIN, LOGOUT' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ enum: ['true', 'false'], description: 'Filter by outcome' })
  @IsOptional()
  @IsIn(['true', 'false'])
  success?: string;

  @ApiPropertyOptional({ description: 'ISO date lower bound (inclusive)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'ISO date upper bound (inclusive)' })
  @IsOptional()
  @IsString()
  to?: string;
}
