import { describe, test, expect } from 'vitest'
import { WebSocket, WebSocketServer } from 'ws'
import { autoReconnect } from '@utils/auto-reconnect.js'
import { ExtraWebSocket, State } from '@src/extra-websocket.js'
import { delay, promisify } from 'extra-promise'

describe('autoReconnect', () => {
  test('reconnect', async () => {
    const server = new WebSocketServer({ port: 8080 })
    server.on('connection', socket => {
      socket.on('message', () => socket.close())
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    const cancel = autoReconnect(ws, 0)
    try {
      await ws.connect()
      ws.send('foo')
      await delay(1000)
      const state = ws.getState()

      expect(state).toBe(State.Connected)
    } finally {
      cancel()
      await ws.close()
      await promisify(server.close.bind(server))()
    }
  })

  test('timeout', async () => {
    const server = new WebSocketServer({ port: 8080 })
    server.on('connection', socket => {
      socket.on('message', () => socket.close())
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    const cancel = autoReconnect(ws, 2000)
    try {
      await ws.connect()
      ws.send('foo')
      await delay(1000)
      const state1 = ws.getState()
      await delay(2000)
      const state2 = ws.getState()

      expect(state1).toBe(State.Closed)
      expect(state2).not.toBe(State.Closed)
    } finally {
      cancel()
      await ws.close()
      await promisify(server.close.bind(server))()
    }
  })

  test('cancel', async () => {
    const server = new WebSocketServer({ port: 8080 })
    server.on('connection', socket => {
      socket.on('message', () => socket.close())
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    const cancel = autoReconnect(ws, 1000)
    try {
      await ws.connect()
      cancel()
      ws.send('foo')
      await delay(2000)
      const state = ws.getState()

      expect(state).toBe(State.Closed)
    } finally {
      cancel()
      await ws.close()
      await promisify(server.close.bind(server))()
    }
  })
})
