// Stub — full implementation in Task 8
export const uploadRuntime = {
  abort: (_id: string) => {},
  cleanup: (_id: string) => {},
}

export function registerProgress(_id: string, _cb: (pct: number) => void) {}
export function unregisterProgress(_id: string) {}
