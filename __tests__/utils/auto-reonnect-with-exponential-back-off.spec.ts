import { WebSocket, WebSocketServer } from 'ws'
import { autoReconnectWithExponentialBackOff } from '@utils/auto-reconnect-with-exponential-back-off.js'
import { ExtraWebSocket, State } from '@src/extra-websocket.js'
import { delay, promisify } from 'extra-promise'

describe('autoReconnectWithExponentialBackOff', () => {
  test('reconnect', async () => {
    const server = new WebSocketServer({ port: 8080 })
    server.on('connection', socket => {
      socket.on('message', () => socket.close())
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    const cancel = autoReconnectWithExponentialBackOff (ws, {
      baseInterval: 0
    , jitter: false
    })
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
    const cancel = autoReconnectWithExponentialBackOff(ws, {
      baseInterval: 2000
    , jitter: false
    })
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
    const cancel = autoReconnectWithExponentialBackOff(ws, {
      baseInterval: 1000
    , jitter: false
    })
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
