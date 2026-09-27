import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type MessageDocument = HydratedDocument<MessageModel>

@Schema({ collection: 'messages', timestamps: true })
export class MessageModel {

  @Prop({ required: true, unique: true })
  id!: string

  @Prop({ required: true })
  tenantId!: string

  @Prop({ required: true })
  conversationId!: string

  @Prop({ required: true })
  senderId!: string

  @Prop({ required: true })
  content!: string

  @Prop({ required: true, type: Date })
  timestamp!: Date

  @Prop({ type: Object })
  metadata?: Record<string, unknown>
}

export const MessageSchema = SchemaFactory.createForClass(MessageModel)

MessageSchema.index({
  tenantId:       1,
  conversationId: 1,
  timestamp:      -1,
})