import { Inject, Injectable } from '@nestjs/common'

import type { MessageSearchRepository } from '../domain/repositories/message-search.repository'

import { MESSAGE_SEARCH_REPOSITORY } from '../messages.tokens'



@Injectable()
export class SearchMessagesService {

  constructor(@Inject(MESSAGE_SEARCH_REPOSITORY) private readonly searchRepository: MessageSearchRepository) {
  }

  async execute(params: { tenantId: string; conversationId: string; query: string; page: number; limit: number }) {

    const result = await this.searchRepository.search(params)
    return {
      data: result.data,
      meta: {
        page:       params.page,
        limit:      params.limit,
        total:      result.total,
        totalPages: Math.ceil(result.total / params.limit),
      },
    }
  }
}