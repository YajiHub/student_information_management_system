import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ description: 'Records per page', default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  per_page: number = 20;

  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'Sort field alias (compatibility)' })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort direction', enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  order: 'asc' | 'desc' | 'ASC' | 'DESC' = 'asc';

  @ApiPropertyOptional({ description: 'Sort direction alias (compatibility)' })
  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'])
  sort_order?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export function buildPaginationMeta(
  totalRecords: number,
  page: number,
  perPage: number,
): PaginationMeta {
  const totalPages = Math.ceil(totalRecords / perPage) || 1;
  return {
    page,
    per_page: perPage,
    total_records: totalRecords,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_prev: page > 1,
  };
}
