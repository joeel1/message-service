import type { Message } from '../entities/message.entity'

export interface MessageSearchRepository {
  search(params: {
    tenantId:       string
    conversationId: string
    query:          string
    page:           number
    limit:          number
  }):            Promise<{
    data:  Message[]
    total: number
  }>

  index(message: Message): Promise<void>
}