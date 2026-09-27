
import { INestApplication, ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'

import { CreateMessageService } from '../src/messages/application/create-message.service'
import { GetMessagesService } from '../src/messages/application/get-messages.service'
import { SearchMessagesService } from '../src/messages/application/search-messages.service'
import { MessagesController } from '../src/messages/presentation/messages.controller'
import { ConversationsController } from '../src/messages/presentation/conversations.controller'



describe('Messages API (e2e)', () => {

  let app: INestApplication

  const createMessageService  = { execute: jest.fn() }
  const getMessagesService    = { execute: jest.fn() }
  const searchMessagesService = { execute: jest.fn() }


  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ MessagesController, ConversationsController ],
      providers:   [
        { provide: CreateMessageService,  useValue: createMessageService  },
        { provide: GetMessagesService,    useValue: getMessagesService    },
        { provide: SearchMessagesService, useValue: searchMessagesService },
      ],
    }).compile()

    app = moduleRef.createNestApplication()
    app.setGlobalPrefix('api')
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
    await app.init()
  })

  beforeEach(()     => { jest.clearAllMocks() })
  afterAll(async () => { await app.close()    })

  
  describe('POST /api/messages', () => {
    it('creates a message', async () => {
      const message = {
        id:             'message-1',
        tenantId:       'tenant-1',
        conversationId: 'conversation-1',
        senderId:       'sender-1',
        content:        'Hello world',
        timestamp:      '2026-09-28T10:00:00.000Z',
      }

      createMessageService.execute.mockResolvedValue(message)

      await request(app.getHttpServer()).post('/api/messages').set('X-Tenant-Id', 'tenant-1').send({
        conversationId: 'conversation-1',
        senderId:       'sender-1',
        content:        'Hello world',
      }).expect(201).expect(message)

      expect(createMessageService.execute).toHaveBeenCalledWith('tenant-1', {
        conversationId: 'conversation-1',
        senderId:       'sender-1',
        content:        'Hello world',
      })
    })

    it('rejects a request without a tenant header', async () => {
      await request(app.getHttpServer()).post('/api/messages').send({
        conversationId: 'conversation-1',
        senderId:       'sender-1',
        content:        'Hello world',
      }).expect(400)
    })

    it('rejects a request with missing required fields', async () => {
      await request(app.getHttpServer()).post('/api/messages').set('X-Tenant-Id', 'tenant-1').send({ conversationId: 'conversation-1' }).expect(400)
      expect(createMessageService.execute).not.toHaveBeenCalled()
    })

    it('rejects unexpected request fields', async () => {
      await request(app.getHttpServer()).post('/api/messages').set('X-Tenant-Id', 'tenant-1').send({
        conversationId: 'conversation-1',
        senderId:       'sender-1',
        content:        'Hello world',
        unexpected:     true,
      }).expect(400)
      expect(createMessageService.execute).not.toHaveBeenCalled()
    })
  })


  describe('GET /api/conversations/:conversationId/messages', () => {
    it('returns paginated conversation messages', async () => {
      const result = {
        data: [{
          id:             'message-1',
          tenantId:       'tenant-1',
          conversationId: 'conversation-1',
          senderId:       'sender-1',
          content:        'Hello world',
          timestamp:      '2026-09-28T10:00:00.000Z',
        }],
        meta: {
          page:       2,
          limit:      10,
          total:      11,
          totalPages: 2,
        },
      }

      getMessagesService.execute.mockResolvedValue(result)

      await request(app.getHttpServer()).get('/api/conversations/conversation-1/messages?page=2&limit=10').set('X-Tenant-Id', 'tenant-1').expect(200).expect(result)
      expect(getMessagesService.execute).toHaveBeenCalledWith({
        tenantId:       'tenant-1',
        conversationId: 'conversation-1',
        page:           2,
        limit:          10,
      })
    })

    it('rejects a request without a tenant header', async () => { 
      await request(app.getHttpServer()).get('/api/conversations/conversation-1/messages').expect(400)
      expect(getMessagesService.execute).not.toHaveBeenCalled()
    })

    it('rejects invalid pagination parameters', async () => {
      await request(app.getHttpServer()).get('/api/conversations/conversation-1/messages?page=0&limit=101').set('X-Tenant-Id', 'tenant-1').expect(400)
      expect(getMessagesService.execute).not.toHaveBeenCalled()
    })
  })

  describe('GET /api/conversations/:conversationId/messages/search', () => {
    it('searches messages in a conversation', async () => {
      const result = {
        datxa: [{
          id:             'message-1',
          tenantId:       'tenant-1',
          conversationId: 'conversation-1',
          senderId:       'sender-1',
          content:        'Hello world',
          timestamp:      '2026-09-28T10:00:00.000Z',
        }],
        meta: {
          page:       1,
          limit:      50,
          total:      1,
          totalPages: 1,
        },
      }

      searchMessagesService.execute.mockResolvedValue(result)

      await request(app.getHttpServer()).get('/api/conversations/conversation-1/messages/search?q=hello').set('X-Tenant-Id', 'tenant-1').expect(200).expect(result)
      expect(searchMessagesService.execute).toHaveBeenCalledWith({
        tenantId:       'tenant-1',
        conversationId: 'conversation-1',
        query:          'hello',
        page:           1,
        limit:          50,
      })
    })

    it('rejects a request without a tenant header', async () => {
      await request(app.getHttpServer()).get('/api/conversations/conversation-1/messages/search?q=hello').expect(400)
      expect(searchMessagesService.execute).not.toHaveBeenCalled()
    })

    it('rejects a search request without a query', async () => {
      await request(app.getHttpServer()).get('/api/conversations/conversation-1/messages/search').set('X-Tenant-Id', 'tenant-1').expect(400)
      expect(searchMessagesService.execute).not.toHaveBeenCalled()
    })
  })
})