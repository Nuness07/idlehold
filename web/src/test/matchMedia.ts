type Listener = (event: MediaQueryListEvent) => void

/**
 * Replaces `window.matchMedia` (missing in jsdom) with one where every query matches or not, as given.
 * Returns a function that flips the answer and notifies the listeners, like resizing across a breakpoint.
 */
export function stubMatchMedia(initial: boolean): (matches: boolean) => void {
  let matches = initial
  const lists: { list: MediaQueryList; listeners: Set<Listener> }[] = []

  window.matchMedia = (query: string) => {
    const listeners = new Set<Listener>()
    const list = {
      get matches() {
        return matches
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
      addListener: (listener: Listener) => listeners.add(listener),
      removeListener: (listener: Listener) => listeners.delete(listener),
      dispatchEvent: () => true,
    } as unknown as MediaQueryList
    lists.push({ list, listeners })
    return list
  }

  return (next) => {
    matches = next
    for (const { list, listeners } of lists) {
      for (const listener of listeners) listener({ matches: next, media: list.media } as MediaQueryListEvent)
    }
  }
}
