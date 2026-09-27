import { Test } from '@nestjs/testing'

import { SearchMessagesService } from './search-messages.service'
import { MESSAGE_SEARCH_REPOSITORY } from '../messages.tokens'


describe('SearchMessagesService', () => {

  let service: SearchMessagesService

  const repository = { search: jest.fn() }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({ providers: [ SearchMessagesService, { provide: MESSAGE_SEARCH_REPOSITORY, useValue: repository } ] }).compile()
    service      = module.get(SearchMessagesService)
  })

  it('searches within the requested tenant and conversation', async () => {
    const messages = [{
      id:             'message-1',
      tenantId:       'tenant-1',
      conversationId: 'conversation-1',
      senderId:       'user-1',
      content:        'Hello world',
      timestamp:      new Date('2026-09-28T10:00:00.000Z'),
    }]

    repository.search.mockResolvedValue({ data: messages, total: 1 })

    const result = await service.execute({ tenantId: 'tenant-1', conversationId: 'conversation-1', query: 'hello', page: 1, limit: 10 })

    expect(repository.search).toHaveBeenCalledWith({
      tenantId:       'tenant-1',
      conversationId: 'conversation-1',
      query:          'hello',
      page:           1,
      limit:          10,
    })

    expect(result).toEqual({
      data: messages,
      meta: {
        page:       1,
        limit:      10,
        total:      1,
        totalPages: 1,
      },
    })
  })
})