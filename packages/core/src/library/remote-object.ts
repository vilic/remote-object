import {hasOwnProperty} from './@utils.js';
import type {
  SerializedRemoteObject,
  SerializedRemoteObjectCall,
  SerializedRemoteObjectCallResult,
} from './x.js';

export abstract class RemoteObject<TObject extends object> {
  constructor(readonly serialized: SerializedRemoteObject) {}

  create(): RemoteObjectInstance<TObject>;
  create(): object {
    const that = this;

    const {serialized} = this;

    return new Proxy(
      {},
      {
        get(target, key) {
          if (typeof key === 'string') {
            const {values} = serialized;

            if (hasOwnProperty.call(values, key)) {
              return values[key];
            }

            const {methods} = serialized;

            if (methods.includes(key)) {
              return async (...args: unknown[]) => {
                const result = await that.call({method: key, args});

                if ('return' in result) {
                  return result.return;
                } else {
                  throw new RemoteObjectCallError(result.throw);
                }
              };
            }
          }

          return Reflect.get(target, key);
        },
      },
    );
  }

  protected abstract call(
    call: SerializedRemoteObjectCall,
  ): Promise<SerializedRemoteObjectCallResult>;
}

export class RemoteObjectCallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export type RemoteObjectInstance<T extends object> = {
  [TKey in keyof T]: T[TKey] extends (...args: infer TArgs) => infer TReturn
    ? (
        ...args: TArgs
      ) => TReturn extends PromiseLike<infer TPromiseValue>
        ? Promise<TPromiseValue>
        : Promise<TReturn>
    : T[TKey];
};
