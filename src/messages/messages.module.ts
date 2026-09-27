import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { ElasticsearchModule } from '@nestjs/elasticsearch'
import { ConfigModule, ConfigService } from '@nestjs/config'

import { MESSAGE_EVENT_PUBLISHER, MESSAGE_REPOSITORY, MESSAGE_SEARCH_REPOSITORY } from './messages.tokens'
import { CreateMessageService } from './application/create-message.service'
import { GetMessagesService } from './application/get-messages.service'
import { SearchMessagesService } from './application/search-messages.service'
import { MessageModel, MessageSchema } from './infrastructure/persistence/message.schema'
import { MongoMessageRepository } from './infrastructure/persistence/mongo-message.repository'
import { KafkaMessageEventPublisher } from './infrastructure/messaging/kafka-message-event.publisher'
import { MessageCreatedConsumer } from './infrastructure/messaging/message-created.consumer'
import { ElasticsearchMessageRepository } from './infrastructure/search/elasticsearch-message.repository'
import { MessagesController } from './presentation/messages.controller'
import { ConversationsController } from './presentation/conversations.controller'


@Module({
  imports: [
    MongooseModule.forFeature([{ name: MessageModel.name, schema: MessageSchema }]),

    ElasticsearchModule.registerAsync({
      imports:    [ ConfigModule ],
      useFactory: (configService: ConfigService) => ({ node: configService.getOrThrow<string>('elasticsearch.node') }),
      inject:     [ConfigService],
    }),
  ],

  controllers: [ MessagesController, ConversationsController ],

  providers:   [
    CreateMessageService,
    GetMessagesService,
    SearchMessagesService,

    MongoMessageRepository,
    KafkaMessageEventPublisher,
    ElasticsearchMessageRepository,
    MessageCreatedConsumer,

    { provide: MESSAGE_REPOSITORY,        useExisting: MongoMessageRepository     },
    { provide: MESSAGE_EVENT_PUBLISHER,   useExisting: KafkaMessageEventPublisher },
    { provide: MESSAGE_SEARCH_REPOSITORY, useExisting: ElasticsearchMessageRepository },
  ],

  exports:     [ CreateMessageService ],
})
export class MessagesModule {}