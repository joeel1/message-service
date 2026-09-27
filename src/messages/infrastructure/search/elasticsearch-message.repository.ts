import { Injectable } from '@nestjs/common'
import { ElasticsearchService } from '@nestjs/elasticsearch'
import { ConfigService } from '@nestjs/config'

import type { Message } from '../../domain/entities/message.entity'
import type { MessageSearchRepository } from '../../domain/repositories/message-search.repository'



interface MessageSearchDocument {
  id:             string
  tenantId:       string
  conversationId: string
  senderId:       string
  content:        string
  timestamp:      string
  metadata?:      Record<string, unknown>
}



@Injectable()
export class ElasticsearchMessageRepository implements MessageSearchRepository {

  private readonly indexName: string

  constructor(private readonly elasticsearchService: ElasticsearchService, private readonly configService: ConfigService) {
    this.indexName = this.configService.getOrThrow<string>('elasticsearch.index')
  }


  async index(message: Message): Promise<void> {

    const document: MessageSearchDocument = {
      id:             message.id,
      tenantId:       message.tenantId,
      conversationId: message.conversationId,
      senderId:       message.senderId,
      content:        message.content,
      timestamp:      message.timestamp.toISOString(),
      metadata:       message.metadata,
    }

    // Using the message ID makes indexing idempotent.
    await this.elasticsearchService.index({ index: this.indexName, id: message.id, document })
  }

  async search(params: { tenantId: string; conversationId: string; query: string; page: number; limit: number }): Promise<{ data: Message[]; total: number }> {

    const { tenantId, conversationId, query, page, limit } = params

    const from     = (page - 1) * limit
    const response = await this.elasticsearchService.search<MessageSearchDocument>({
      index: this.indexName,

      from,
      size: limit,

      query: {
        bool: {
          filter: [
            { term: { tenantId       } },
            { term: { conversationId } },
          ],

          must: [ { match: { content: query } } ],
        },
      },

      sort: [ { timestamp: 'desc' } ],
    })

    const total = typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value ?? 0

    return { 
      data: response.hits.hits.filter((hit): hit is typeof hit & { _source: MessageSearchDocument } => hit._source !== undefined).map((hit) => ({ ...hit._source, timestamp: new Date(hit._source.timestamp) })), 
      total 
    } 
  }
}