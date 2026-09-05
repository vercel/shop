export type VariantProps<T> = { [K in keyof T]?: keyof T[K] | null };
