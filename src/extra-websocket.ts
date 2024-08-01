import type {
  WebSocket
, Event as OpenEvent
, MessageEvent
, ErrorEvent
, CloseEvent
} from 'ws'
import { TypedArray, assert } from '@blackglory/prelude'
import { Queue, Emitter } from '@blackglory/structures'

export enum BinaryType {
  NodeBuffer
, ArrayBuffer
, Fragments
}

export enum State {
  Closed
, Connecting
, Connected
, Closing
}

enum ReadyState {
  CONNECTING = 0
, OPEN = 1
, CLOSING = 2
, CLOSED = 3
}

type Data =
| string
| ArrayBufferLike
| Buffer
| TypedArray
| DataView

export class ExtraWebSocket extends Emitter<{
  open: [event: OpenEvent]
  message: [event: MessageEvent]
  error: [event: ErrorEvent]
  close: [event: CloseEvent]
}> {
  private instance?: WebSocket
  private binaryType = BinaryType.NodeBuffer
  protected unsentMessages = new Queue<Data>()

  constructor(private createWebSocket: () => WebSocket) {
    super()
  }

  getState(): State {
    if (this.instance) {
      switch (this.instance.readyState) {
        case ReadyState.CONNECTING: return State.Connecting
        case ReadyState.OPEN: return State.Connected
        case ReadyState.CLOSING: return State.Closing
        case ReadyState.CLOSED: return State.Closed
        default: throw new Error('Unknown state')
      }
    } else {
      return State.Closed
    }
  }

  getBinaryType(): BinaryType {
    return this.binaryType
  }

  setBinaryType(val: BinaryType): void {
    this.binaryType = val

    if (this.instance) {
      switch (val) {
        case BinaryType.NodeBuffer:
          this.instance.binaryType = 'nodebuffer'
          break
        case BinaryType.ArrayBuffer:
          this.instance.binaryType = 'arraybuffer'
          break
        case BinaryType.Fragments:
          this.instance.binaryType = 'fragments'
          break
        default: throw new Error('Unknown binary type')
      }
    }
  }

  connect(signal?: AbortSignal): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      signal?.throwIfAborted()
      assert(this.getState() === State.Closed, 'WebSocket is not closed')

      const self = this
      const ws = this.createWebSocket()
      this.instance = ws

      signal?.addEventListener('abort', abortListener, { once: true })
      ws.addEventListener('error', errorListener, { once: true })

      ws.addEventListener('open', event => this.emit('open', event))
      ws.addEventListener('message', event => this.emit('message', event))
      ws.addEventListener('error', event => this.emit('error', event))
      ws.addEventListener('close', event => this.emit('close', event))

      this.setBinaryType(this.binaryType)

      ws.addEventListener('open', openListener, { once: true })

      function abortListener() {
        assert(signal)

        ws.removeAllListeners('open')
        ws.removeAllListeners('message')
        ws.removeAllListeners('error')
        ws.removeAllListeners('close')
        ws.close()

        reject(signal.reason)
      }

      function errorListener(err: ErrorEvent) {
        ws.removeAllListeners('open')
        ws.removeAllListeners('message')
        ws.removeAllListeners('error')
        ws.removeAllListeners('close')
        signal?.removeEventListener('abort', abortListener)

        reject(err.error)
      }

      function openListener(event: OpenEvent) {
        ws.removeEventListener('error', errorListener)
        signal?.removeEventListener('abort', abortListener)

        for (let size = self.unsentMessages.size; size--;) {
          self.send(self.unsentMessages.dequeue()!)
        }
        resolve()
      }
    })
  }

  close(code?: number, reason?: string): Promise<void> {
    return new Promise(resolve => {
      assert(this.instance, 'WebSocket is not created')

      switch (this.getState()) {
        case State.Closed:
          resolve()
          break
        case State.Closing:
          this.instance.addEventListener('close', () => resolve(), { once: true })
          break
        default:
          this.instance.addEventListener('close', () => resolve(), { once: true })
          this.instance.close(code, reason)
      }
    })
  }

  send(data: Data): void {
    this.unsentMessages.enqueue(data)

    if (this.getState() === State.Connected) {
      this.instance!.send(data, () => this.unsentMessages.dequeue())
    }
  }

  ping(): void {
    assert(this.instance, 'WebSocket is not created')

    this.instance.ping()
  }
}
