import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { debounce } from './debounce'

describe('debounce', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not call fn immediately', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    expect(fn).not.toHaveBeenCalled()
  })

  it('calls fn after delay with last args', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    debounced('b')
    debounced('c')
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledOnce()
    expect(fn).toHaveBeenCalledWith('c')
  })

  it('resets timer on each call', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced('a')
    vi.advanceTimersByTime(200)
    debounced('b')
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })
})
