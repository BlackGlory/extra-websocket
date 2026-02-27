import { ExtraWebSocket, State } from '@src/extra-websocket.js'
import { calculateExponentialBackoffTimeout } from 'extra-timers'
import { pass } from '@blackglory/prelude'
import { delay } from 'extra-promise'
import { waitForFunction } from '@blackglory/wait-for'
import { AbortController, timeoutSignal, raceAbortSignals } from 'extra-abort'

export function autoReconnectWithExponentialBackOff(
  ws: ExtraWebSocket
, {
    baseInterval
  , maxInterval = Infinity
  , factor = 2
  , jitter = true
  }: {
    baseInterval: number
    maxInterval?: number
    factor?: number
    jitter?: boolean
  }
, connectTimeout?: number
): () => void {
  const controller = new AbortController()

  // Make sure the error listener is added, prevent crashes due to uncaught errors.
  const removeErrorListener = ws.on('error', pass)
  let removeCloseListener = ws.once('close', closeListener)

  return () => {
    controller.abort()

    removeCloseListener()
    removeErrorListener()
  }

  async function closeListener(): Promise<void> {
    let retries = 0
    while (true) {
      if (controller.signal.aborted) return

      await delay(calculateExponentialBackoffTimeout({
        retries
      , baseTimeout: baseInterval
      , maxTimeout: maxInterval
      , factor
      , jitter
      }))
      if (controller.signal.aborted) return

      try {
        await waitForFunction(() => ws.getState() === State.Closed)
        await ws.connect(
          raceAbortSignals([
            connectTimeout && timeoutSignal(connectTimeout)
          , controller.signal
          ])
        )

        removeCloseListener()
        removeCloseListener = ws.once('close', closeListener)

        break
      } catch {
        retries++
      }
    }
  }
}
