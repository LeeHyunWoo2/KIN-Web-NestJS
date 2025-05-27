/* eslint-disable */

import pino from 'pino';
const pinoElasticsearch = require('pino-elasticsearch');

export const createMultiStream = (): pino.DestinationStream => {
  const streams: pino.StreamEntry[] = [];

  streams.push({ stream: pino.destination(1) });

  streams.push({
    stream: pinoElasticsearch({
      node: 'http://localhost:9200',
      index: 'nestjs-logs',
      esVersion: 8,
    }),
  });

  return pino.multistream(streams);
};
