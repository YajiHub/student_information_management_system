import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

/**
 * Course catalog listing filters. Inherits `search` (matches course code or
 * title), pagination, and sort parameters.
 */
export class QueryCoursesDto extends PaginationQueryDto {}
