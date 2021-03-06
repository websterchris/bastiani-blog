import RelaySSR from 'react-relay-network-modern-ssr/node8/client';
import {
  cacheMiddleware,
  RelayNetworkLayer,
  urlMiddleware
} from 'react-relay-network-modern/node8';
import { Environment, RecordSource, Store } from 'relay-runtime';

const source = new RecordSource();
const store = new Store(source);

let storeEnvironment: any = null;

export default {
  createEnvironment: (relayData: any) => {
    if (storeEnvironment) {
      return storeEnvironment;
    }

    storeEnvironment = new Environment({
      store,
      network: new RelayNetworkLayer([
        cacheMiddleware({
          size: 100,
          ttl: 60 * 1000
        }),
        new RelaySSR(relayData).getMiddleware({
          lookup: false
        }),
        urlMiddleware({
          url: () => ''
        }),
        next => async req => {
          req.fetchOpts.headers.Authorization = relayData
            ? relayData.token
            : '';
          const res = await next(req);
          return res;
        }
      ])
    });

    return storeEnvironment;
  }
};
