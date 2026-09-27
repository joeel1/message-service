import type { MessageCreatedEvent } from './message-created.event'

export interface MessageEventPublisher {
  publish(event: MessageCreatedEvent): Promise<void>
}