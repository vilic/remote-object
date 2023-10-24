import {getObjectPrototypes} from './@utils.js';
import type {
  SerializedRemoteObject,
  SerializedRemoteObjectCall,
  SerializedRemoteObjectCallResult,
} from './x.js';

const ERROR_CALLBACK_DEFAULT = (): void => {};

export type RemoteOptions = {
  /**
   * Serialize getters and methods recursively.
   */
  recursive?: boolean;
  /**
   * Error message will be omitted (as 'Unknown error') if the error thrown with
   * a remote object call is not an instance of `ExpectedError`, defaults to
   * `Error`.
   */
  ExpectedError?: new (...args: never[]) => Error;
  onCallError?: (error: unknown) => void;
  onUnexpectedCallError?: (error: unknown) => void;
};

export class Remote {
  readonly options: Required<RemoteOptions>;

  constructor({
    recursive = false,
    ExpectedError = Error,
    onCallError = ERROR_CALLBACK_DEFAULT,
    onUnexpectedCallError = ERROR_CALLBACK_DEFAULT,
  }: RemoteOptions = {}) {
    this.options = {
      recursive,
      ExpectedError,
      onCallError,
      onUnexpectedCallError,
    };
  }

  serialize(object: object): SerializedRemoteObject {
    const keySet = new Set<string>();

    const values: Record<string, unknown> = {};
    const methods: string[] = [];

    for (const prototype of this.getObjectAndPrototypes(object)) {
      for (const [key, {value, get}] of Object.entries(
        Object.getOwnPropertyDescriptors(prototype),
      )) {
        if (keySet.has(key)) {
          continue;
        }

        keySet.add(key);

        if (typeof get === 'function') {
          values[key] = get.call(object);
        } else if (typeof value === 'function') {
          methods.push(key);
        } else {
          values[key] = value;
        }
      }
    }

    return {values, methods};
  }

  async call(
    object: object,
    {method, args}: SerializedRemoteObjectCall,
  ): Promise<SerializedRemoteObjectCallResult> {
    const {
      options: {ExpectedError, onCallError, onUnexpectedCallError},
    } = this;

    for (const prototype of this.getObjectAndPrototypes(object)) {
      const descriptor = Object.getOwnPropertyDescriptor(prototype, method);

      const value = descriptor?.value;

      if (typeof value !== 'function') {
        continue;
      }

      try {
        return {return: await value.apply(object, args)};
      } catch (error) {
        onCallError(error);

        if (error instanceof ExpectedError) {
          return {throw: error.message};
        } else {
          onUnexpectedCallError(error);

          return {throw: 'Unknown error'};
        }
      }
    }

    return {
      throw: `Method ${JSON.stringify(
        method,
      )} does not exist or is not accessible on object.`,
    };
  }

  private getObjectAndPrototypes(object: object): object[] {
    const {
      options: {recursive},
    } = this;

    if (recursive) {
      return [object, ...getObjectPrototypes(object)];
    } else {
      const prototype = Object.getPrototypeOf(object);
      return prototype === null || prototype === Object.prototype
        ? [object]
        : [object, prototype];
    }
  }
}
