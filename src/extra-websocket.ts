import type {
  WebSocket
, Event as OpenEvent
, MessageEvent
, ErrorEvent
, CloseEvent
} from 'ws'
import { assert } from '@blackglory/prelude'
import { Queue } from '@blackglory/structures'

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

export class ExtraWebSocket {
  private instance?: WebSocket
  private eventListeners = new Map<string, Set<Function>>()
  private binaryType = BinaryType.NodeBuffer
  protected unsentMessages = new Queue<unknown>()

  constructor(private createWebSocket: () => WebSocket) {}

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

  addEventListener(event: 'message', listener: (event: MessageEvent) => void): void
  addEventListener(event: 'close', listener: (event: CloseEvent) => void): void
  addEventListener(event: 'error', listener: (event: ErrorEvent) => void): void
  addEventListener(event: 'open', listener: (event: OpenEvent) => void): void
  addEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }

    const listeners = this.eventListeners.get(event)!
    listeners.add(listener)

    this.instance?.addEventListener(event as any, listener as any)
  }

  removeEventListener(event: 'message', listener: (event: MessageEvent) => void): void
  removeEventListener(event: 'close', listener: (event: CloseEvent) => void): void
  removeEventListener(event: 'error', listener: (event: ErrorEvent) => void): void
  removeEventListener(event: 'open', listener: (event: OpenEvent) => void): void
  removeEventListener(event: string, listener: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }

    const listeners = this.eventListeners.get(event)!
    listeners.delete(listener)
    if (listeners.size === 0) {
      this.eventListeners.delete(event)
    }

    this.instance?.removeEventListener(event as any, listener as any)
  }

  connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      assert(this.getState() === State.Closed, 'WebSocket is not closed')

      const self = this
      const ws = this.instance = this.createWebSocket()

      ws.addEventListener('error', errorListener, { once: true })
      for (const [event, listeners] of this.eventListeners) {
        for (const listener of listeners) {
          ws.addEventListener(event as any, listener as any)
        }
      }

      this.setBinaryType(this.binaryType)

      ws.addEventListener('open', openListener, { once: true })

      function errorListener(err: ErrorEvent) {
        ws.removeEventListener('open', openListener)
        reject(err.error)
      }

      function openListener(event: OpenEvent) {
        ws.removeEventListener('error', errorListener)
        for (let size = self.unsentMessages.size; size--;) {
          self.send(self.unsentMessages.dequeue())
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

  send(data: unknown): void {
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
