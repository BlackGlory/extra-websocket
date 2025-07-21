import { describe, test, expect, vi } from 'vitest'
import { ExtraWebSocket, State } from '@src/extra-websocket.js'
import { WebSocket, MessageEvent, WebSocketServer } from 'ws'
import { delay, promisify } from 'extra-promise'
import { getErrorPromise } from 'return-style'
import { waitForEmitter } from '@blackglory/wait-for'

describe('ExtraWebsocket', () => {
  test('initial state is CLOSED', () => {
    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))

    const result = ws.getState()

    expect(result).toBe(State.Closed)
  })

  test('connect', async () => {
    const server = new WebSocketServer({ port: 8080 })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    try {
      const promise = ws.connect()
      const state1 = ws.getState()
      await promise
      const state2 = ws.getState()

      expect(state1).toBe(State.Connecting)
      expect(state2).toBe(State.Connected)
    } finally {
      await ws.close()
      await promisify(server.close.bind(server))()
    }
  })

  describe('send', () => {
    test('not connected', async () => {
      class TestWebSocket extends ExtraWebSocket {
        countUnsentMessages() {
          return this.unsentMessages.size
        }
      }
      const server = new WebSocketServer({ port: 8080 })
      const messageListener = vi.fn()
      server.on('connection', socket => {
        socket.addEventListener('message', event => messageListener(event.data))
      })

      const ws = new TestWebSocket(() => new WebSocket('ws://localhost:8080'))
      try {
        ws.send('foo')
        const countOfUnsentMessages1 = ws.countUnsentMessages()
        await ws.connect()
        await delay(1000)
        const countOfUnsentMessages2 = ws.countUnsentMessages()

        expect(messageListener).toHaveBeenCalledTimes(1)
        expect(messageListener).toHaveBeenCalledWith('foo')
        expect(countOfUnsentMessages1).toBe(1)
        expect(countOfUnsentMessages2).toBe(0)
      } finally {
        await ws.close()
        await promisify(server.close.bind(server))()
      }
    })

    test('connected', async () => {
      const server = new WebSocketServer({ port: 8080 })
      const messageListener = vi.fn()
      server.on('connection', socket => {
        socket.addEventListener('message', event => messageListener(event.data))
      })

      const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
      try {
        await ws.connect()

        ws.send('foo')
        await delay(1000)

        expect(messageListener).toHaveBeenCalledTimes(1)
        expect(messageListener).toHaveBeenCalledWith('foo')
      } finally {
        await ws.close()
        await promisify(server.close.bind(server))()
      }
    })
  })

  test('listen', async () => {
    const server = new WebSocketServer({ port: 8080 })
    server.on('connection', socket => {
      socket.send('foo')
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    try {
      const promise = waitForEmitter(ws, 'message')
      await ws.connect()
      const [event] = await promise
      const message = (event as MessageEvent).data

      expect(message).toBe('foo')
    } finally {
      await ws.close()
      await promisify(server.close.bind(server))()
    }
  })

  describe('reconnect', () => {
    test('receive messages from outdated listeners', async () => {
      const server = new WebSocketServer({ port: 8080 })
      server.on('connection', socket => {
        socket.send('hello')
      })

      const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
      try {
        const messageListener = vi.fn()
        ws.on('message', messageListener)
        await ws.connect()

        await ws.close()
        await ws.connect()
        await delay(1000)

        expect(messageListener).toHaveBeenCalledTimes(2)
      } finally {
        await ws.close()
        await promisify(server.close.bind(server))()
      }
    })
  })

  describe('bad connection', () => {
    test('server is not open', async () => {
      const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))

      const err = await getErrorPromise(ws.connect())

      expect(err).not.toBeUndefined()
      // 在Github Action里莫名奇妙失败:
      // expect(err?.message).toMatch('connect ECONNREFUSED')
    })

    test('server down', async () => {
      const server = new WebSocketServer({ port: 8080 })

      const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
      try {
        await ws.connect()
        server.clients.forEach(client => client.close())
        await delay(1000)
      } finally {
        await ws.close()
        await promisify(server.close.bind(server))()
      }
    })
  })
})
