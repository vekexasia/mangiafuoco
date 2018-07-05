export type MethodDecorator<T, K> = (
  target: T,
  method: string,
  descriptor: TypedPropertyDescriptor<K>
) => TypedPropertyDescriptor<K>;
