import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Kafka, Producer } from 'kafkajs'

import type { MessageCreatedEvent } from '../../domain/events/message-created.event'
import type { MessageEventPublisher } from '../../domain/events/message-event.publisher'



@Injectable()
export class KafkaMessageEventPublisher implements MessageEventPublisher, OnModuleInit, OnModuleDestroy {

  private readonly logger    = new Logger(KafkaMessageEventPublisher.name)

  private readonly producer: Producer
  private readonly topic:    string

  private connected          = false

  constructor(private readonly configService: ConfigService) {

    const brokers  = this.configService.getOrThrow<string[]>('kafka.brokers')
    const clientId = this.configService.getOrThrow<string>('kafka.clientId')

    this.topic     = this.configService.getOrThrow<string>('kafka.messageTopic')

    const kafka    = new Kafka({
      clientId,
      brokers,
      connectionTimeout: this.configService.getOrThrow<number>('kafka.connectionTimeout'),
      retry:             {
        initialRetryTime: this.configService.getOrThrow<number>('kafka.retry.initialRetryTime'),
        retries:          this.configService.getOrThrow<number>('kafka.retry.retries'),
      },
    })

    this.producer = kafka.producer()
    this.registerEventHandlers()
  }


  async onModuleInit(): Promise<void> {
    try {
      await this.connect()
    } catch {
      this.logger.warn('Kafka is unavailable. Producer will reconnect when required.')
    }
  }


  async onModuleDestroy(): Promise<void> {
    if (!this.connected)
      return
    await this.producer.disconnect()
    this.connected = false
  }


  async publish(event: MessageCreatedEvent): Promise<void> {

    if (!this.connected)
      await this.connect()

    try {
      await this.producer.send({
        topic:    this.topic,
        messages: [{
          key:   event.conversationId,
          value: JSON.stringify(event),
        }],
      })
    } catch (error) {
      this.connected = false
      this.logger.error('Failed to publish Kafka event', error instanceof Error ? error.stack : String(error))
      throw error
    }
  }


  private async connect(): Promise<void> {

    if (this.connected)
      return

    try {
      await this.producer.connect()
      this.connected = true
      this.logger.log('Kafka producer connected')
    } catch (error) {
      this.connected = false
      this.logger.error('Failed to connect to Kafka', error instanceof Error ? error.stack : String(error))
      throw error
    }
  }


  private registerEventHandlers(): void {
    this.producer.on(this.producer.events.CONNECT, () => {
      this.connected = true
      this.logger.log('Kafka producer connected')
    })

    this.producer.on(this.producer.events.DISCONNECT, () => {
      this.connected = false
      this.logger.warn('Kafka producer disconnected')
    })
  }
}