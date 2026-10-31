import { describe, expect, test } from 'bun:test'
import {
  stopServerGracefully,
  type ShutdownTimer,
} from './shutdown'

function createFakeTimer() {
  let callback: (() => void) | undefined
  let active = false
  let nextHandle = 0

  const timer: ShutdownTimer = {
    setTimeout: (nextCallback) => {
      callback = nextCallback
      active = true
      nextHandle += 1
      return nextHandle as unknown as ReturnType<typeof setTimeout>
    },
    clearTimeout: () => {
      active = false
    },
  }

  return {
    timer,
    fire: () => {
      if (active) callback?.()
    },
    isActive: () => active,
  }
}

describe('stopServerGracefully', () => {
  test('waits for in-flight work without forcing active connections closed', async () => {
    const calls: (boolean | undefined)[] = []
    const fakeTimer = createFakeTimer()
    let finishStop: (() => void) | undefined
    const server = {
      stop: (closeActiveConnections?: boolean) => {
        calls.push(closeActiveConnections)

        return new Promise<void>((resolve) => {
          finishStop = resolve
        })
      },
    }

    const stopping = stopServerGracefully(server, 15_000, fakeTimer.timer)
    let settled = false
    void stopping.then(() => {
      settled = true
    })

    await Promise.resolve()
    expect(settled).toBe(false)
    expect(calls).toEqual([undefined])

    finishStop?.()

    expect(await stopping).toBe('graceful')
    expect(fakeTimer.isActive()).toBe(false)
  })

  test('uses the platform timer when no timer adapter is supplied', async () => {
    const server = { stop: async () => {} }

    expect(await stopServerGracefully(server, 15_000)).toBe('graceful')
  })

  test('forces active connections closed when the grace period expires', async () => {
    const calls: (boolean | undefined)[] = []
    const fakeTimer = createFakeTimer()
    const server = {
      stop: (closeActiveConnections?: boolean) => {
        calls.push(closeActiveConnections)

        if (closeActiveConnections) return Promise.resolve()
        return new Promise<void>(() => {})
      },
    }

    const stopping = stopServerGracefully(server, 15_000, fakeTimer.timer)
    fakeTimer.fire()

    const outcome = await stopping

    expect(outcome).toBe('forced')
    expect(calls).toEqual([undefined, true])
    expect(fakeTimer.isActive()).toBe(false)
  })

  test('rejects invalid grace periods', async () => {
    const server = { stop: async () => {} }

    await expect(stopServerGracefully(server, -1)).rejects.toThrow(
      'Shutdown grace period must be a non-negative integer.',
    )
    await expect(stopServerGracefully(server, 1.5)).rejects.toThrow(
      'Shutdown grace period must be a non-negative integer.',
    )
  })
})
