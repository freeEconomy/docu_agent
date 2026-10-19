import { Dispatcher, getGlobalDispatcher, setGlobalDispatcher } from 'undici';
if (process.env.DOCUMIND_TEST_MODE === '1' && process.env.DOCUMIND_TEST_AI_URL) {
  if (process.env.VERCEL) throw new Error('Only for isolated local tests');
  const target = new URL(process.env.DOCUMIND_TEST_AI_URL);
  if (target.hostname !== '127.0.0.1') throw new Error('Only loopback test AI is allowed');
  const previous = getGlobalDispatcher();
  class Redirect extends Dispatcher {
    dispatch(options, handler) {
      if (new URL(String(options.origin)).hostname === 'generativelanguage.googleapis.com') {
        return previous.dispatch(
          { ...options, origin: target.origin, path: options.path },
          handler,
        );
      }
      return previous.dispatch(options, handler);
    }
  }
  setGlobalDispatcher(new Redirect());
}
