import { BadRequestException, Headers } from '@nestjs/common'


export function getTenantId(headers: Record<string, string | string[] | undefined>): string {

  const tenantId = headers['x-tenant-id']
  if (!tenantId || Array.isArray(tenantId))
    throw new BadRequestException('X-Tenant-Id header is required')

  return tenantId
}