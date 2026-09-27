export const messageSearchMapping = {

  properties: {
    id:             { type: 'keyword' },
    tenantId:       { type: 'keyword' },
    conversationId: { type: 'keyword' },
    senderId:       { type: 'keyword' },
    content:        { type: 'text'    },

    timestamp:      { type: 'date' },
  },
} as const