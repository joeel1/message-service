import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Kafka, Consumer } from 'kafkajs'

import type { Message } from '../../domain/entities/message.entity'
import type { MessageCreatedEvent } from '../../domain/events/message-created.event'
import { MESSAGE_SEARCH_REPOSITORY } from '../../messages.tokens'
import { Inject } from '@nestjs/common'
import type { MessageSearchRepository } from '../../domain/repositories/message-search.repository'



@Injectable()
export class MessageCreatedConsumer implements OnModuleInit, OnModuleDestroy {

  private readonly logger = new Logger(MessageCreatedConsumer.name)

  private readonly consumer: Consumer
  private readonly topic:    string

  private stopping                  = false
  private readonly reconnectDelayMs = 5000

  constructor(private readonly configService: ConfigService, @Inject(MESSAGE_SEARCH_REPOSITORY) private readonly searchRepository: MessageSearchRepository) {

    const kafka = new Kafka({
      clientId:          this.configService.getOrThrow<string>('kafka.clientId'),
      brokers:           this.configService.getOrThrow<string[]>('kafka.brokers'),
      connectionTimeout: this.configService.getOrThrow<number>('kafka.connectionTimeout'),
      retry:             {
        initialRetryTime: this.configService.getOrThrow<number>('kafka.retry.initialRetryTime'),
        retries:          this.configService.getOrThrow<number>('kafka.retry.retries'),
      },
    })

    this.topic    = this.configService.getOrThrow<string>('kafka.messageTopic')
    this.consumer = kafka.consumer({ groupId: this.configService.getOrThrow<string>('kafka.consumerGroup') })
    this.registerEventHandlers()
  }


  async onModuleInit(): Promise<void> {
    void this.startConsumer()
  }

  async onModuleDestroy(): Promise<void> {
    this.stopping = true
    try {
      await this.consumer.stop()
      await this.consumer.disconnect()
    } catch (error) {
      this.logger.error('Error shutting down Kafka consumer', error instanceof Error ? error.stack : String(error))
    }
  }


  private async startConsumer(): Promise<void> {
    while (!this.stopping) {
      try {
        await this.consumer.connect()
        await this.consumer.subscribe({ topic: this.topic, fromBeginning: false })

        this.logger.log(`Subscribed to ${this.topic}`)
        await this.consumer.run({ eachMessage: async ({ message }) => { await this.processMessage(message.value?.toString()) }})

        // KafkaJS normally keeps the consumer running.
        // Reaching here unexpectedly triggers reconnection.
        if (!this.stopping)
          this.logger.warn('Kafka consumer stopped')
      } catch (error) {
        if (!this.stopping)
          this.logger.error('Kafka consumer connection/runtime failure', error instanceof Error ? error.stack : String(error))
      }

      if (!this.stopping)
        await new Promise((resolve) => setTimeout(resolve, this.reconnectDelayMs))
    }
  }


  private async processMessage(value: string | undefined): Promise<void> {
    try {
      if (!value) {
        this.logger.warn('Received empty Kafka message')
        return
      }

      const event            = this.parseEvent(value)
      const message: Message = {
        id:             event.messageId,
        tenantId:       event.tenantId,
        conversationId: event.conversationId,
        senderId:       event.senderId,
        content:        event.content,
        timestamp:      new Date(event.timestamp),
        metadata:       event.metadata,
      }
      await this.searchRepository.index(message)
    } catch (error) {
      this.logger.error('Failed to process Kafka message', error instanceof Error ? error.stack : String(error))
    }
  }  


  private parseEvent(value: string): MessageCreatedEvent {
    const event: unknown = JSON.parse(value)
    if (typeof event !== 'object'          || event === null                      || !('eventType' in event)                  || 
      event.eventType !== 'MessageCreated' || !('version' in event)               || event.version !== 1                      || 
      !('messageId' in event)              || typeof event.messageId !== 'string' || !('tenantId' in event)                   || 
      typeof event.tenantId !== 'string'   || !('conversationId' in event)        || typeof event.conversationId !== 'string' ||
      !('senderId' in event)               || typeof event.senderId !== 'string'  || !('content' in event)                    || 
      typeof event.content !== 'string'    || !('timestamp' in event)             || typeof event.timestamp !== 'string' ) {
      throw new Error('Invalid MessageCreated event')
    }
    return event as MessageCreatedEvent
  }

  private registerEventHandlers(): void {
    this.consumer.on(this.consumer.events.CRASH,      (event) => { this.logger.error('Kafka consumer crashed', event.payload.error) })
    this.consumer.on(this.consumer.events.DISCONNECT, ()      => { this.logger.warn('Kafka consumer disconnected')                  })
    this.consumer.on(this.consumer.events.CONNECT,    ()      => { this.logger.log('Kafka consumer connected')                      })
  }
}