import { useCallback, useRef, useState } from "react";

/**
 * A hook for managing controlled/uncontrolled component state.
 * Replaces @radix-ui/react-use-controllable-state.
 */
export function useControllableState<T>({
  prop,
  defaultProp,
  onChange,
}: {
  prop?: T;
  defaultProp?: T;
  onChange?: (value: T) => void;
}): [T, (value: T | ((prev: T) => T)) => void] {
  const isControlled = prop !== undefined;
  const [internal, setInternal] = useState(defaultProp as T);
  const value = isControlled ? prop : internal;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      if (isControlled) {
        const nextValue = typeof next === "function" ? (next as (prev: T) => T)(prop) : next;
        onChangeRef.current?.(nextValue);
      } else {
        setInternal((prev) => {
          const nextValue = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
          onChangeRef.current?.(nextValue);
          return nextValue;
        });
      }
    },
    [isControlled, prop],
  );

  return [value, setValue];
}
