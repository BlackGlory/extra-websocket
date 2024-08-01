import { ExtraWebSocket, State } from '@src/extra-websocket.js'
import { calculateExponentialBackoffTimeout } from 'extra-timers'
import { pass } from '@blackglory/prelude'
import { delay } from 'extra-promise'
import { waitForFunction } from '@blackglory/wait-for'
import { AbortController, timeoutSignal } from 'extra-abort'

export function autoReconnectWithExponentialBackOff(
  ws: ExtraWebSocket
, {
    baseTimeout
  , maxTimeout = Infinity
  , factor = 2
  , jitter = true
  , connectTimeout
  }: {
    baseTimeout: number
    maxTimeout?: number
    factor?: number
    jitter?: boolean
    connectTimeout?: number
  }
): () => void {
  const controller = new AbortController()

  // Make sure the error listener is added, prevent crashes due to uncaught errors.
  const removeErrorListener = ws.on('error', pass)
  let removeCloseListener = ws.once('close', listener)
  return () => {
    controller.abort()
    removeCloseListener()
    removeErrorListener()
  }

  async function listener(): Promise<void> {
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
        await ws.connect(
          connectTimeout
        ? timeoutSignal(connectTimeout)
        : undefined
        )
        if (controller.signal.aborted) return

        removeCloseListener = ws.once('close', listener)
        break
      } catch {
        retries++
        pass()
      }
    }
  }
}
