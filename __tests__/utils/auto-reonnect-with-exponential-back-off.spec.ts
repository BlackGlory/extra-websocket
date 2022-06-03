import { WebSocket, Server } from 'ws'
import { autoReconnectWithExponentialBackOff } from '@utils/auto-reconnect-with-exponential-back-off'
import { ExtraWebSocket, State } from '@src/extra-websocket'
import { delay } from 'extra-promise'

describe('autoReconnectWithExponentialBackOff', () => {
  test('reconnect', async () => {
    const server = new Server({ port: 8080 })
    server.on('connection', socket => {
      socket.on('message', () => socket.close())
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    const cancel = autoReconnectWithExponentialBackOff (ws, { baseTimeout: 0 })
    try {
      await ws.connect()
      ws.send('foo')
      await delay(1000)
      const state = ws.getState()

      expect(state).toBe(State.Connected)
    } finally {
      cancel()
      await ws.close()
      server.close()
    }
  })

  test('timeout', async () => {
    const server = new Server({ port: 8080 })
    server.on('connection', socket => {
      socket.on('message', () => socket.close())
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    const cancel = autoReconnectWithExponentialBackOff(ws, { baseTimeout: 2000 })
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
      server.close()
    }
  })

  test('cancel', async () => {
    const server = new Server({ port: 8080 })
    server.on('connection', socket => {
      socket.on('message', () => socket.close())
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    const cancel = autoReconnectWithExponentialBackOff(ws, { baseTimeout: 1000 })
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
      server.close()
    }
  })
})
