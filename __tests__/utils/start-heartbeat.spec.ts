import { WebSocket, Server } from 'ws'
import { startHeartbeat } from '@utils/start-heartbeat'
import { ExtraWebSocket } from '@src/extra-websocket'
import { delay } from 'extra-promise'

describe('startHeartbeat', () => {
  test('heartbeat', async () => {
    const server = new Server({ port: 8080 })
    const pingListener = jest.fn()
    server.on('connection', socket => 
      socket.on('ping', pingListener)
    )

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    const cancel = startHeartbeat(ws, 0)
    try {
      await ws.connect()
      await delay(1000)

      expect(pingListener).toBeCalled()
    } finally {
      cancel()
      await ws.close()
      server.close()
    }
  })

  test('interval', async () => {
    const server = new Server({ port: 8080 })
    const pingListener = jest.fn()
    server.on('connection', socket => 
      socket.on('ping', pingListener)
    )

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    const cancel = startHeartbeat(ws, 1000)
    try {
      await ws.connect()
      await delay(1100)
      const calledTimes1 = pingListener.mock.calls.length
      await delay(1100)
      const calledTimes2 = pingListener.mock.calls.length

      expect(calledTimes1).toBe(1)
      expect(calledTimes2).toBe(2)
    } finally {
      cancel()
      await ws.close()
      server.close()
    }
  })

  test('cancel', async () => {
    const server = new Server({ port: 8080 })
    const pingListener = jest.fn()
    server.on('connection', socket => 
      socket.on('ping', pingListener)
    )

    const ws = new ExtraWebSocket(() => new WebSocket('ws://localhost:8080'))
    const cancel = startHeartbeat(ws, 1000)
    try {
      await ws.connect()
      cancel()
      await delay(1100)

      expect(pingListener).toBeCalledTimes(0)
    } finally {
      cancel()
      await ws.close()
      server.close()
    }
  })
})
