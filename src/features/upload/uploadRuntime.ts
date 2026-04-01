const controllers = new Map<string, AbortController>()
const progressCallbacks = new Map<string, (pct: number) => void>()
const files = new Map<string, File>()

export const uploadRuntime = {
  registerController(id: string, ctrl: AbortController, file?: File) {
    controllers.set(id, ctrl)
    if (file) files.set(id, file)
  },
  getFile(id: string): File | undefined {
    return files.get(id)
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
    files.delete(id)
  },
}

export function registerProgress(id: string, cb: (pct: number) => void) {
  uploadRuntime.registerProgress(id, cb)
}

export function unregisterProgress(id: string) {
  uploadRuntime.unregisterProgress(id)
}
