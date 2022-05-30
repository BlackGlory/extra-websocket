import {
  WebSocket
, Event as OpenEvent
, MessageEvent
, ErrorEvent
, CloseEvent
} from 'ws'
import { assert } from '@blackglory/prelude'

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

export class ExtraWebSocket {
  private instance?: WebSocket
  private eventListeners: Map<string, Set<Function>> = new Map()
  private binaryType: BinaryType = BinaryType.NodeBuffer

  constructor(private createWebSocket: () => WebSocket) {}

  getState(): State {
    if (this.instance) {
      switch (this.instance.readyState) {
        case 0: return State.Connecting
        case 1: return State.Connected
        case 2: return State.Closing
        case 3: return State.Closed
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
      assert(
        this.getState() === State.Closing ||
        this.getState() === State.Closed
      , 'WebSocket is not closing or closed'
      )

      const ws = this.createWebSocket()
      ws.addEventListener('error', errorListener)
      ws.addEventListener('open', () => {
        this.instance?.removeEventListener('error', errorListener)
        resolve()
      })

      for (const [event, listeners] of this.eventListeners) {
        for (const listener of listeners) {
          ws.addEventListener(event as any, listener as any)
        }
      }

      this.instance = ws
      this.setBinaryType(this.binaryType)

      function errorListener(err: ErrorEvent) {
        reject(err.error)
      }
    })
  }

  close(code?: number, reason?: string): Promise<void> {
    return new Promise<void>(resolve => {
      assert(this.instance, 'WebSocket is not created')

      switch (this.getState()) {
        case State.Closed: return resolve()
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
    assert(this.instance, 'WebSocket is not created')

    this.instance.send(data)
  }

  ping(): void {
    assert(this.instance, 'WebSocket is not created')

    this.instance.ping()
  }
}
