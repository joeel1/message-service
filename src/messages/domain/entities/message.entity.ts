export interface Message {
  id:             string
  tenantId:       string
  conversationId: string
  senderId:       string
  content:        string
  timestamp:      Date
  metadata?:      Record<string, unknown>
}