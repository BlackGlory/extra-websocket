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

class ExtraWebSocket {
  constructor(createWebSocket: () => WebSocket)

  getState(): State
  getBinaryType(): BinaryType
  setBinaryType(val: BinaryType): void

  connect(): Promise<void>
  close(code?: number, reason?: string): Promise<void>
  send(data: unknown): void
  ping(): void

  addEventListener(event: 'message', listener: (event: MessageEvent) => void): void
  addEventListener(event: 'close', listener: (event: CloseEvent) => void): void
  addEventListener(event: 'error', listener: (event: ErrorEvent) => void): void
  addEventListener(event: 'open', listener: (event: OpenEvent) => void): void

  removeEventListener(event: 'message', listener: (event: MessageEvent) => void): void
  removeEventListener(event: 'close', listener: (event: CloseEvent) => void): void
  removeEventListener(event: 'error', listener: (event: ErrorEvent) => void): void
  removeEventListener(event: 'open', listener: (event: OpenEvent) => void): void
}
```
