// Tree-shaking optimized React imports
// This file centralizes commonly used React imports to enable better tree shaking

// Core React hooks that are most commonly used
export {
    useState,
    useEffect,
    useCallback,
    useMemo,
    useRef,
    useContext,
    useReducer,
    useImperativeHandle,
    useLayoutEffect,
    useDeferredValue,
    useTransition,
    useId,
    useSyncExternalStore,
} from 'react';

// React types commonly used
export type {
    ReactNode,
    ReactElement,
    Component,
    ComponentProps,
    ComponentType,
    FC,
    PropsWithChildren,
    CSSProperties,
    MouseEvent,
    ChangeEvent,
    FormEvent,
    KeyboardEvent,
    TouchEvent,
    FocusEvent,
    HTMLAttributes,
    InputHTMLAttributes,
    ButtonHTMLAttributes,
    FormHTMLAttributes,
    Ref,
    RefObject,
    MutableRefObject,
} from 'react';

// Re-export React default for when needed
export { default as React } from 'react';
