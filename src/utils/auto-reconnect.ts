import { ExtraWebSocket } from '@src/extra-websocket'
import { delay } from 'extra-promise'
import { pass } from '@blackglory/prelude'
import { AbortController } from 'extra-abort'

export function autoReconnect(
  ws: ExtraWebSocket
, timeout: number = 0
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

    while (true) {
      if (controller.signal.aborted) return

      await delay(timeout)
      if (controller.signal.aborted) return

      try {
        await ws.connect()
        if (controller.signal.aborted) return

        ws.addEventListener('close', listener)
        break
      } catch {
        pass()
      }
    }
  }
}
