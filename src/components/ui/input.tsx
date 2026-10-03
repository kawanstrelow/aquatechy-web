import * as React from 'react';

import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

function wheelDeltaY(event: WheelEvent) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 16;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * window.innerHeight;
  return event.deltaY;
}

function scrollByWheel(start: HTMLElement, event: WheelEvent) {
  const deltaY = wheelDeltaY(event);
  let el: HTMLElement | null = start.parentElement;

  while (el) {
    const { overflowY } = getComputedStyle(el);
    const canScroll =
      (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') && el.scrollHeight > el.clientHeight;
    if (canScroll) {
      el.scrollTop += deltaY;
      return;
    }
    el = el.parentElement;
  }

  const scrollingElement = document.scrollingElement;
  if (scrollingElement) scrollingElement.scrollTop += deltaY;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, onWheel, ...props }, ref) => {
  const localRef = React.useRef<HTMLInputElement | null>(null);

  const setRef = (node: HTMLInputElement | null) => {
    localRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  React.useEffect(() => {
    const input = localRef.current;
    if (!input || type !== 'number') return;

    const handleWheel = (event: WheelEvent) => {
      if (document.activeElement !== input) return;
      event.preventDefault();
      input.blur();
      scrollByWheel(input, event);
    };

    input.addEventListener('wheel', handleWheel, { passive: false });
    return () => input.removeEventListener('wheel', handleWheel);
  }, [type]);

  return (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-slate-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300',
        className
      )}
      ref={setRef}
      onWheel={onWheel}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export { Input };
