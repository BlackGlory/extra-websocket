import { ExtraWebSocket, State } from '@src/extra-websocket'
import { calculateExponentialBackoffTimeout } from 'extra-timers'
import { pass } from '@blackglory/prelude'
import { delay } from 'extra-promise'
import { waitForFunction } from '@blackglory/wait-for'

export function autoReconnectWithExponentialBackOff(
  ws: ExtraWebSocket
, {
    baseTimeout
  , maxTimeout = Infinity
  , factor = 2
  , jitter = true
  }: {
    baseTimeout: number
    maxTimeout?: number
    factor?: number
    jitter?: boolean
  }
): () => void {
  const controller = new AbortController()

  // Make sure the error listener is added, prevent crashes due to uncaught errors.
  ws.addEventListener('error', ignore)
  ws.addEventListener('close', listener)
  return () => {
    controller.abort()
    ws.removeEventListener('close', listener)
    ws.removeEventListener('error', ignore)
  }

  function ignore() {
    pass()
  }

  async function listener(): Promise<void> {
    ws.removeEventListener('close', listener)

    let retries = 0
    while (true) {
      if (controller.signal.aborted) return

      await delay(calculateExponentialBackoffTimeout({
        retries
      , baseTimeout
      , maxTimeout
      , factor
      , jitter
      }))
      if (controller.signal.aborted) return

      try {
        await waitForFunction(() => ws.getState() === State.Closed)
        await ws.connect()
        if (controller.signal.aborted) return

        ws.addEventListener('close', listener)
        break
      } catch {
        retries++
        pass()
      }
    }
  }
}
