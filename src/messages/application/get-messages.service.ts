import { Inject, Injectable } from '@nestjs/common'

import type { MessageRepository } from '../domain/repositories/message.repository'
import { MESSAGE_REPOSITORY } from '../messages.tokens'


@Injectable()
export class GetMessagesService { 
  
  constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepository: MessageRepository) {
  }


  async execute(params: { tenantId: string; conversationId: string; page: number; limit: number }) {

    const result = await this.messageRepository.findByConversation(params)
    return {
      data: result.data,
      meta: {
        page:       params.page,
        limit:      params.limit,
        total:      result.total,
        totalPages: Math.ceil(result.total / params.limit),
      },
    }
  }
}