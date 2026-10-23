// The little of Vue that the house theme's TypeScript uses, for the type
// check (tools/tsconfig.json). Not the real package: a copy of Vue at the
// root could reach a talk's build, which must use the talk's own.

export interface Ref<T> {
  value: T;
}

export function onBeforeUnmount(hook: () => void): void;
