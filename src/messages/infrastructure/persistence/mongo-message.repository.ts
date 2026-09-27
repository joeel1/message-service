import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'

import type { Message } from '../../domain/entities/message.entity'
import type { MessageRepository } from '../../domain/repositories/message.repository'
import { MessageModel, MessageDocument } from './message.schema'


@Injectable()
export class MongoMessageRepository implements MessageRepository {

  constructor(@InjectModel(MessageModel.name) private readonly messageModel: Model<MessageDocument>) {
  }

  async create(message: Message): Promise<Message> {
    const document = await this.messageModel.create(message)
    return this.toDomain(document)
  }

  async findByConversation(params: { tenantId: string; conversationId: string; page: number; limit: number }): Promise<{ data: Message[]; total: number }> {

    const { tenantId, conversationId, page, limit } = params

    const filter = { tenantId, conversationId }
    const skip   = (page - 1) * limit

    const [documents, total] = await Promise.all([ 
      this.messageModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).lean().exec(),
      this.messageModel.countDocuments(filter).exec(),
    ])

    return {
      data: documents.map((document) => ({
        id:             document.id,
        tenantId:       document.tenantId,
        conversationId: document.conversationId,
        senderId:       document.senderId,
        content:        document.content,
        timestamp:      document.timestamp,
        metadata:       document.metadata,
      })),
      total,
    }
  }

  private toDomain(document: MessageDocument): Message {
    return {
      id:             document.id,
      tenantId:       document.tenantId,
      conversationId: document.conversationId,
      senderId:       document.senderId,
      content:        document.content,
      timestamp:      document.timestamp,
      metadata:       document.metadata,
    }
  }
}