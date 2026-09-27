import { Inject, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import type { CreateMessageDto } from '../presentation/dto/create-message.dto'
import type { Message } from '../domain/entities/message.entity'
import type { MessageCreatedEvent } from '../domain/events/message-created.event'
import type { MessageRepository } from '../domain/repositories/message.repository'
import type { MessageEventPublisher } from '../domain/events/message-event.publisher'

import { MESSAGE_EVENT_PUBLISHER, MESSAGE_REPOSITORY } from '../messages.tokens'



@Injectable()
export class CreateMessageService {

  constructor(@Inject(MESSAGE_REPOSITORY) private readonly messageRepository: MessageRepository, @Inject(MESSAGE_EVENT_PUBLISHER) private readonly eventPublisher: MessageEventPublisher) {

  }


  async execute(tenantId: string, dto: CreateMessageDto ): Promise<Message> {

    const message: Message = {
      id:             randomUUID(),
      tenantId,
      conversationId: dto.conversationId,
      senderId:       dto.senderId,
      content:        dto.content,
      timestamp:      new Date(),
      metadata:       dto.metadata,
    }

    const createdMessage = await this.messageRepository.create(message)

    const event: MessageCreatedEvent = {
      eventId:        randomUUID(),
      eventType:      'MessageCreated',
      version:        1,
      tenantId:       createdMessage.tenantId,
      messageId:      createdMessage.id,
      conversationId: createdMessage.conversationId,
      senderId:       createdMessage.senderId,
      content:        createdMessage.content,
      timestamp:      createdMessage.timestamp.toISOString(),
      metadata:       createdMessage.metadata,
    }

    await this.eventPublisher.publish(event)
    return createdMessage
  }
}