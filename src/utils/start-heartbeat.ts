import { setDynamicTimeoutLoop } from 'extra-timers'
import { ExtraWebSocket, State } from '@src/extra-websocket'

export function startHeartbeat(ws: ExtraWebSocket, interval: number): () => void {
  return setDynamicTimeoutLoop(
    interval
  , async () => {
      if (ws.getState() === State.Connected) {
        ws.ping()
      } else {
        await new Promise<void>(resolve => {
          ws.addEventListener('open', function openListener() {
            resolve()
            ws.removeEventListener('open', openListener)
          })
        })
      }
    }
  )
}
