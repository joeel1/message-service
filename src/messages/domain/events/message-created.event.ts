export interface MessageCreatedEvent {
  eventId:   string
  eventType: 'MessageCreated'
  version:   1

  tenantId:       string
  messageId:      string
  conversationId: string
  senderId:       string
  content:        string
  timestamp:      string

  metadata?: Record<string, unknown>
}