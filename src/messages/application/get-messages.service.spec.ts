import { Test } from '@nestjs/testing'

import { GetMessagesService } from './get-messages.service'
import { MESSAGE_REPOSITORY } from '../messages.tokens'



describe('GetMessagesService', () => {

  let service:       GetMessagesService

  const repository = { findByConversation: jest.fn() }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({ providers: [ GetMessagesService, { provide: MESSAGE_REPOSITORY, useValue: repository } ] }).compile()
    service      = module.get(GetMessagesService)
  })

  it('returns messages and pagination metadata', async () => {
    const messages = [{
      id:             'message-1',
      tenantId:       'tenant-1',
      conversationId: 'conversation-1',
      senderId:       'user-1',
      content:        'Hello',
      timestamp:      new Date('2026-09-28T10:00:00.000Z'),
    }]

    repository.findByConversation.mockResolvedValue({ data: messages, total: 21 })
    const result = await service.execute({ tenantId: 'tenant-1', conversationId: 'conversation-1', page: 2, limit: 10 })

    expect(repository.findByConversation).toHaveBeenCalledWith({
      tenantId:       'tenant-1',
      conversationId: 'conversation-1',
      page:           2,
      limit:          10,
    })

    expect(result).toEqual({
      data: messages,
      meta: {
        page:       2,
        limit:      10,
        total:      21,
        totalPages: 3,
      },
    })
  })
})