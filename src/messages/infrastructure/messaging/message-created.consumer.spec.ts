
import { ConfigService } from '@nestjs/config'
import { Kafka } from 'kafkajs'

import { MESSAGE_SEARCH_REPOSITORY } from '../../messages.tokens'
import type { MessageSearchRepository } from '../../domain/repositories/message-search.repository'
import { MessageCreatedConsumer } from './message-created.consumer'


jest.mock('kafkajs', () => ({
  Kafka: jest.fn().mockImplementation(() => ({
    consumer: jest.fn().mockReturnValue({
      on:         jest.fn(),
      events:     { CRASH: 'consumer.crash', DISCONNECT: 'consumer.disconnect', CONNECT: 'consumer.connect' },
      connect:    jest.fn(),
      subscribe:  jest.fn(),
      run:        jest.fn(),
      stop:       jest.fn(),
      disconnect: jest.fn(),
    }),
  })),
}))


describe('MessageCreatedConsumer', () => {
  let consumer:         MessageCreatedConsumer
  let searchRepository: jest.Mocked<MessageSearchRepository>
  let loggerError:      jest.SpyInstance
  let loggerWarn:       jest.SpyInstance


  const configValues: Record<string, unknown> = {
    'kafka.clientId':               'message-service',
    'kafka.brokers':                ['localhost:9092'],
    'kafka.connectionTimeout':      3000,
    'kafka.retry.initialRetryTime': 100,
    'kafka.retry.retries':          3,
    'kafka.messageTopic':           'messages.events',
    'kafka.consumerGroup':          'message-search-indexer',
  }

  const configService = { getOrThrow: jest.fn((key: string) => configValues[key]) } as unknown as ConfigService

  beforeEach(() => {
    jest.clearAllMocks()

    searchRepository = { search: jest.fn(), index: jest.fn().mockResolvedValue(undefined) } as jest.Mocked<MessageSearchRepository>
    consumer         = new MessageCreatedConsumer(configService, searchRepository)
    loggerError      = jest.spyOn((consumer as any).logger, 'error').mockImplementation(() => {})
    loggerWarn       = jest.spyOn((consumer as any).logger, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    loggerError.mockRestore()
    loggerWarn.mockRestore()
  })

  afterEach(() => { loggerError.mockRestore(); loggerWarn.mockRestore() })

  it('indexes a valid MessageCreated event', async () => {
    const event = {
      eventId:        'event-1',
      eventType:      'MessageCreated',
      version:        1,
      tenantId:       'tenant-1',
      messageId:      'message-1',
      conversationId: 'conversation-1',
      senderId:       'sender-1',
      content:        'Hello world',
      timestamp:      '2026-09-28T10:00:00.000Z',
      metadata:       { source: 'test' },
    }

    await (consumer as any).processMessage(JSON.stringify(event))

    expect(searchRepository.index).toHaveBeenCalledWith({
      id:             'message-1',
      tenantId:       'tenant-1',
      conversationId: 'conversation-1',
      senderId:       'sender-1',
      content:        'Hello world',
      timestamp:      new Date('2026-09-28T10:00:00.000Z'),
      metadata:       { source: 'test' },
    })
  })

  it('logs and skips an empty Kafka message', async () => {
    await (consumer as any).processMessage(undefined)
    expect(searchRepository.index).not.toHaveBeenCalled()
    expect(loggerWarn).toHaveBeenCalledWith('Received empty Kafka message')
  })

  it('logs and skips an invalid event', async () => {
    await (consumer as any).processMessage(JSON.stringify({ eventType: 'UnknownEvent' }))
    expect(searchRepository.index).not.toHaveBeenCalled()
    expect(loggerError).toHaveBeenCalledWith('Failed to process Kafka message', expect.any(String))
  })

  it('logs indexing failures without throwing', async () => {
    searchRepository.index.mockRejectedValue(new Error('Elasticsearch unavailable'))
    await expect(
      (consumer as any).processMessage(
        JSON.stringify({
          eventType:      'MessageCreated',
          version:        1,
          tenantId:       'tenant-1',
          messageId:      'message-1',
          conversationId: 'conversation-1',
          senderId:       'sender-1',
          content:        'Hello world',
          timestamp:      '2026-09-28T10:00:00.000Z',
        }),
      ),
    ).resolves.toBeUndefined()

    expect(loggerError).toHaveBeenCalledWith('Failed to process Kafka message', expect.any(String))
  })
})