import { Dispatcher, getGlobalDispatcher, setGlobalDispatcher } from 'undici';
export function installBlobRedirect(endpoint) {
  const previous = getGlobalDispatcher();
  class Redirect extends Dispatcher {
    dispatch(options, handler) {
      if (
        new URL(String(options.origin)).hostname === 'teststore.private.blob.vercel-storage.com'
      ) {
        const target = new URL(endpoint);
        return previous.dispatch(
          { ...options, origin: target.origin, path: '/raw' + options.path },
          handler,
        );
      }
      return previous.dispatch(options, handler);
    }
  }
  setGlobalDispatcher(new Redirect());
  return () => setGlobalDispatcher(previous);
}
if (process.env.DOCUMIND_TEST_MODE === '1' && process.env.VERCEL_BLOB_API_URL) {
  if (process.env.VERCEL) throw new Error('Only for isolated local tests');
  installBlobRedirect(process.env.VERCEL_BLOB_API_URL);
}
