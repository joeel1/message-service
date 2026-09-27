import { BadRequestException, Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common'

import { CreateMessageService } from '../application/create-message.service'
import { CreateMessageDto } from './dto/create-message.dto'



@Controller('messages')
export class MessagesController {

  constructor(private readonly createMessageService: CreateMessageService) {
  }


  @Post()
  async create(@Headers('x-tenant-id') tenantId: string, @Body() dto: CreateMessageDto) {

    if (!tenantId?.trim())
      throw new BadRequestException('X-Tenant-Id header is required')

    return this.createMessageService.execute(tenantId, dto)
  }
}