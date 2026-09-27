import { Logger, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { buildPaginationMeta } from '../common/dto/pagination-query.dto';

export interface AuditLogEntry {
  actor_id: number | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  method: string;
  path: string;
  resource: string | null;
  resource_id: string | null;
  status_code: number;
  success: boolean;
  duration_ms: number;
  ip: string | null;
  user_agent: string | null;
  error_message: string | null;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Persist one audit entry. Logging must never break the request it describes,
   * so every failure is swallowed into a warning.
   */
  async record(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({ data: entry });
    } catch (error: any) {
      this.logger.warn(`Failed to persist audit log entry: ${error?.message}`);
    }
  }

  async findAll(query: QueryAuditLogDto) {
    const page = query.page || 1;
    const perPage = query.per_page || 20;
    const skip = (page - 1) * perPage;

    const where: Prisma.AuditLogWhereInput = {};

    if (query.actor_id) {
      where.actor_id = query.actor_id;
    }

    if (query.resource) {
      where.resource = query.resource;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.success !== undefined) {
      where.success = query.success === 'true';
    }

    if (query.search) {
      const search = query.search.trim();
      where.OR = [
        { actor_email: { contains: search, mode: 'insensitive' } },
        { path: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
      ];
    }

    const createdAt: Prisma.DateTimeFilter = {};
    if (query.from) {
      createdAt.gte = new Date(query.from);
    }
    if (query.to) {
      createdAt.lte = new Date(query.to);
    }
    if (Object.keys(createdAt).length > 0) {
      where.created_at = createdAt;
    }

    const [totalRecords, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: perPage,
        orderBy: { created_at: 'desc' },
      }),
    ]);

    return {
      message: 'Audit logs retrieved successfully.',
      data: logs,
      meta: buildPaginationMeta(totalRecords, page, perPage),
    };
  }
}
