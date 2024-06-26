import assert from 'assert';
import { Buffer } from 'buffer';
import { Readable } from 'stream';
import { Response as NodeFetchResponse, ResponseInit as NodeFetchResponseInit } from 'node-fetch';
import { NFCResponseMetadata } from '../types.js';

const responseInternalSymbol = Object.getOwnPropertySymbols(new NodeFetchResponse())[1];
assert(responseInternalSymbol, 'Failed to get node-fetch responseInternalSymbol');

export class NFCResponse extends NodeFetchResponse {
  static serializeMetaFromNodeFetchResponse(response: NodeFetchResponse): NFCResponseMetadata {
    const metaData = {
      url: response.url,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers.raw(),
      size: response.size,
      timeout: response.timeout,
      counter: (response as any)[responseInternalSymbol!].counter as number,
    };

    return metaData;
  }

  static cacheMissResponse(
    url: string,
  ) {
    return new NFCResponse(
      Readable.from(Buffer.alloc(0)),
      {
        url,
        status: 504,
        statusText: 'Gateway Timeout',
        headers: {},
        size: 0,
        timeout: 0,
        counter: 0,
      },
      async () => undefined,
      false,
      true,
    );
  }

  constructor(
    bodyStream: NodeJS.ReadableStream,
    metaData: Omit<NodeFetchResponseInit, 'headers'> & {
      counter: number;
      headers: Record<string, string[]>;
    },
    public readonly ejectFromCache: () => Promise<unknown>,
    public readonly returnedFromCache: boolean,
    public readonly isCacheMiss = false,
  ) {
    super(
      bodyStream,
      metaData,
    );
  }
}
