import type { Message } from '../entities/message.entity'

export interface MessageRepository {

  create(message: Message): Promise<Message>

  findByConversation(params: {
    tenantId:       string
    conversationId: string
    page:           number
    limit:          number
  }): Promise<{
    data:  Message[]
    total: number
  }>
}