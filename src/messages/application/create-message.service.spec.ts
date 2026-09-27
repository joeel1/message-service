import { Test } from '@nestjs/testing'

import { CreateMessageService } from './create-message.service'
import { MESSAGE_REPOSITORY, MESSAGE_EVENT_PUBLISHER } from '../messages.tokens'
import type { MessageRepository } from '../domain/repositories/message.repository'
import type { MessageEventPublisher } from '../domain/events/message-event.publisher'


describe('CreateMessageService', () => {
  
  let service:     CreateMessageService
  const repository = { create: jest.fn() }
  const publisher  = { publish: jest.fn() }

  beforeEach(async () => {
    jest.clearAllMocks()
    const module = await Test.createTestingModule({
      providers: [
        CreateMessageService,
        { provide: MESSAGE_REPOSITORY,      useValue: repository },
        { provide: MESSAGE_EVENT_PUBLISHER, useValue: publisher },
      ],
    }).compile()
    service = module.get(CreateMessageService)
  })

  it('persists a message and publishes its creation event', async () => {
    repository.create.mockImplementation(async (message) => message)
    publisher.publish.mockResolvedValue(undefined)

    const result = await service.execute('tenant-1', {
      conversationId: 'conversation-1',
      senderId:       'user-1',
      content:        'Hello',
    })

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      tenantId:       'tenant-1',
      conversationId: 'conversation-1',
      senderId:       'user-1',
      content:        'Hello',
    }))

    expect(publisher.publish).toHaveBeenCalledWith(expect.objectContaining({
      eventType:      'MessageCreated',
      tenantId:       'tenant-1',
      messageId:      result.id,
      conversationId: 'conversation-1',
    }))
  })

  it('propagates a Kafka publication failure', async () => {
    repository.create.mockImplementation(async (message) => message)
    publisher.publish.mockRejectedValue(new Error('Kafka unavailable'))

    await expect(service.execute('tenant-1', {
      conversationId: 'conversation-1',
      senderId:       'user-1',
      content:        'Hello',
    })).rejects.toThrow('Kafka unavailable')
  })
})