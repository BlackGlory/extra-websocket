import { ExtraWebSocket, State } from '@src/extra-websocket'
import { WebSocket, Server, Data } from 'ws'
import { delay } from 'extra-promise'
import { getErrorPromise } from 'return-style'

describe('ExtraWebsocket', () => {
  test('initial state is CLOSED', () => {
    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))

    const result = ws.getState()

    expect(result).toBe(State.Closed)
  })

  test('connect', async () => {
    const server = new Server({ port: 8080 })

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
      server.close()
    }
  })

  test('send', async () => {
    const server = new Server({ port: 8080 })
    const messageListener = jest.fn()
    server.on('connection', socket => {
      socket.addEventListener('message', event => messageListener(event.data))
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    try {
      await ws.connect()

      ws.send('foo')
      await delay(1000)

      expect(messageListener).toBeCalledTimes(1)
      expect(messageListener).toBeCalledWith('foo')
    } finally {
      await ws.close()
      server.close()
    }
  })

  test('listen', async () => {
    const server = new Server({ port: 8080 })
    server.on('connection', socket => {
      socket.send('foo')
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    try {
      const promise = waitForMessage(ws)
      await ws.connect()
      const message = await promise

      expect(message).toBe('foo')
    } finally {
      await ws.close()
      server.close()
    }
  })

  test('reconnect', async () => {
    const server = new Server({ port: 8080 })
    server.on('connection', socket => {
      socket.send('hello')
    })

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    try {
      const messageListener = jest.fn()
      ws.addEventListener('message', messageListener)
      await ws.connect()

      await ws.close()
      await ws.connect()
      await delay(1000)

      expect(messageListener).toBeCalledTimes(2)
    } finally {
      await ws.close()
      server.close()
    }
  })

  test('bad connection', async () => {
    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))

    const err = await getErrorPromise(ws.connect())

    expect(err?.message).toBe('connect ECONNREFUSED 127.0.0.1:8080')
  })
})

function waitForMessage(ws: ExtraWebSocket): Promise<Data> {
  return new Promise(resolve => {
    ws.addEventListener('message', function listener(event) {
      resolve(event.data)
      ws.removeEventListener('message', listener)
    })
  })
} 
