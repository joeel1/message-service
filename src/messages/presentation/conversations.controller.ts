import { BadRequestException, Controller, Get, Headers, Param, Query } from '@nestjs/common'

import { GetMessagesService } from '../application/get-messages.service'
import { GetMessagesDto } from './dto/get-messages.dto'
import { SearchMessagesService } from '../application/search-messages.service'
import { SearchMessagesDto } from './dto/search-messages.dto'


@Controller('conversations')
export class ConversationsController {

  constructor(private readonly getMessagesService: GetMessagesService, private readonly searchMessagesService: SearchMessagesService) {
  }


  @Get(':conversationId/messages')
  async getMessages(@Headers('x-tenant-id') tenantId: string, @Param('conversationId') conversationId: string, @Query() query: GetMessagesDto) {

    if (!tenantId?.trim())
      throw new BadRequestException('X-Tenant-Id header is required')

    return this.getMessagesService.execute({ tenantId, conversationId, page: query.page, limit: query.limit })
  }


  @Get(':conversationId/messages/search')
  async searchMessages(@Headers('x-tenant-id') tenantId: string, @Param('conversationId') conversationId: string, @Query() query: SearchMessagesDto) {

    if (!tenantId?.trim())
      throw new BadRequestException('X-Tenant-Id header is required')

    return this.searchMessagesService.execute({ tenantId, conversationId, query: query.q, page: query.page, limit: query.limit })
  }
}