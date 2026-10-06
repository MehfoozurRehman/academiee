export type Widen<T> = { [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };
