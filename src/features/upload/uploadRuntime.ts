const controllers = new Map<string, AbortController>()
const progressCallbacks = new Map<string, (pct: number) => void>()

export const uploadRuntime = {
  registerController(id: string, ctrl: AbortController) {
    controllers.set(id, ctrl)
  },
  registerProgress(id: string, cb: (pct: number) => void) {
    progressCallbacks.set(id, cb)
  },
  unregisterProgress(id: string) {
    progressCallbacks.delete(id)
  },
  notifyProgress(id: string, pct: number) {
    progressCallbacks.get(id)?.(pct)
  },
  abort(id: string) {
    controllers.get(id)?.abort()
  },
  cleanup(id: string) {
    controllers.delete(id)
    progressCallbacks.delete(id)
  },
}

export function registerProgress(id: string, cb: (pct: number) => void) {
  uploadRuntime.registerProgress(id, cb)
}

export function unregisterProgress(id: string) {
  uploadRuntime.unregisterProgress(id)
}
