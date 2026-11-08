import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  type Placement,
} from '@floating-ui/react'
import { cloneElement, useState, type HTMLProps, type ReactElement, type ReactNode, type Ref } from 'react'
import { cn } from '../lib/cn'

/** The trigger receives the tooltip's ref and event handlers, so it must pass them on to a DOM element. */
type Trigger = ReactElement<HTMLProps<HTMLElement> & { ref?: Ref<HTMLElement> }>

interface TooltipProps {
  /** What the tooltip shows. Start with a {@link TooltipTitle}; more lines follow below it. */
  content: ReactNode
  /** One focusable element (a button), which opens the tooltip. */
  children: Trigger
  placement?: Placement
}

/**
 * The game's tooltip: a dark panel with a gold rule that names the thing under the pointer, and later says
 * more about it (what it does, how long it takes, what it is worth).
 *
 * Opens on hover with a short delay, on keyboard focus, and on a tap on touch screens, where there is no
 * hover; closes on Escape, a tap elsewhere, or leaving. It is drawn in a portal, so a panel's overflow
 * never clips it, and it flips and shifts to stay on screen.
 */
export function Tooltip({ content, children, placement = 'top' }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement,
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  })

  const { getReferenceProps, getFloatingProps } = useInteractions([
    useHover(context, { delay: { open: 150, close: 0 }, move: false }),
    useFocus(context),
    // A mouse already opened it on hover; a click only toggles it for touch and pen.
    useClick(context, { ignoreMouse: true }),
    useDismiss(context),
    useRole(context, { role: 'tooltip' }),
  ])

  // Callback refs that attach the trigger and the panel, not refs read during render.
  const { setReference, setFloating } = refs

  return (
    <>
      {cloneElement(children, getReferenceProps({ ref: setReference, ...children.props }))}
      {open && (
        <FloatingPortal>
          <div
            ref={setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={cn(
              'pointer-events-none z-[60] max-w-72 rounded-sm border-2 border-ochre/80 bg-frame-well px-3 py-2',
              'text-parchment shadow-[0_0_0_1px_rgb(0_0_0/0.9),0_6px_16px_rgb(0_0_0/0.45)]',
            )}
          >
            {content}
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

/** The tooltip's heading: the name of the thing. Details will follow below it. */
export function TooltipTitle({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-tight font-extrabold tracking-[0.01em]">{children}</p>
}
