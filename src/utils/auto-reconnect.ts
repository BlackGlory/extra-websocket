import { ExtraWebSocket, State } from '@src/extra-websocket.js'
import { delay } from 'extra-promise'
import { pass } from '@blackglory/prelude'
import { AbortController } from 'extra-abort'
import { waitForFunction } from '@blackglory/wait-for'

export function autoReconnect(
  ws: ExtraWebSocket
, timeout: number = 0
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
    while (true) {
      if (controller.signal.aborted) return

      await delay(timeout)
      if (controller.signal.aborted) return

      try {
        await waitForFunction(() => ws.getState() === State.Closed)
        await ws.connect()
        if (controller.signal.aborted) return

        removeCloseListener = ws.once('close', listener)
        break
      } catch {
        pass()
      }
    }
  }
}
