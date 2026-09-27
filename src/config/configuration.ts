

export default () => ({
  app: {
    port:    parseInt(process.env.PORT ?? '3000', 10),
    nodeEnv: process.env.NODE_ENV ?? 'development',
  },

  mongodb: { uri: process.env.MONGODB_URI ?? '' },

  kafka: {
    brokers:       (process.env.KAFKA_BROKERS ?? '').split(',').map((broker) => broker.trim()).filter(Boolean),
    clientId:      process.env.KAFKA_CLIENT_ID ?? 'message-service',
    messageTopic:  process.env.KAFKA_MESSAGE_TOPIC ?? 'messages.events',
    consumerGroup: process.env.KAFKA_CONSUMER_GROUP ?? 'message-search-indexer',

    connectionTimeout:  parseInt(process.env.KAFKA_CONNECTION_TIMEOUT ?? '10000', 10),
    retry: {
      initialRetryTime: parseInt(process.env.KAFKA_RETRY_INITIAL_TIME ?? '300', 10),
      retries:          parseInt(process.env.KAFKA_RETRY_COUNT ?? '8',          10),
    },
  },

  elasticsearch: {
    node:  process.env.ELASTICSEARCH_NODE ?? '',
    index: process.env.ELASTICSEARCH_INDEX ?? 'messages-v1',
  },

  pagination:    {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE ?? '50', 10),
    maxPageSize:     parseInt(process.env.MAX_PAGE_SIZE ?? '100',    10),
  },
})