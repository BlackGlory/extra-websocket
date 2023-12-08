import { setDynamicTimeoutLoop } from 'extra-timers'
import { ExtraWebSocket, State } from '@src/extra-websocket.js'
import { waitForEmitter } from '@blackglory/wait-for'

export function startHeartbeat(ws: ExtraWebSocket, interval: number): () => void {
  return setDynamicTimeoutLoop(
    interval
  , async () => {
      if (ws.getState() === State.Connected) {
        ws.ping()
      } else {
        await waitForEmitter(ws, 'open')
      }
    }
  )
}
