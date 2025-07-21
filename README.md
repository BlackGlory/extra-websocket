# extra-websocket
## Install
```sh
npm install --save extra-websocket
# or
yarn add extra-websocket
```

## API
### ExtraWebSocket
```ts
import { WebSocket, Event as OpenEvent, MessageEvent, ErrorEvent, CloseEvent } from 'ws'
import { Emitter } from '@blackglory/structures'

enum BinaryType {
  NodeBuffer
, ArrayBuffer
, Fragments
}

enum State {
  Closed
, Connecting
, Connected
, Closing
}

class ExtraWebSocket extends Emitter<{
  open: [event: OpenEvent]
  message: [event: MessageEvent]
  error: [event: ErrorEvent]
  close: [event: CloseEvent]
}> {
  constructor(createWebSocket: () => WebSocket)

  getState(): State
  getBinaryType(): BinaryType
  setBinaryType(val: BinaryType): void

  connect(signal?: AbortSignal): Promise<void>
  close(code?: number, reason?: string): Promise<void>
  send(data: string | ArrayBufferLike | Buffer | TypedArray | DataView): void
  ping(): void
}
```

### autoReconnect
```ts
function autoReconnect(
  ws: ExtraWebSocket
, reconnectInterval: number = 0
, connectTimeout?: number
): () => void
```

### autoReconnectWithExponentialBackOff
```ts
function autoReonnectWithExponentialBackOff(
  ws: ExtraWebSocket
, options: {
    baseTimeout: number
    maxTimeout?: number = Infinity
    factor?: number = 2
    jitter?: boolean = true
    connectTimeout?: number
  }
): () => void
```

### startHeartbeat
```ts
function startHeartbeat(ws: ExtraWebSocket, interval: number): () => void
```
