import type {AssertTrue, IsEqual} from 'tslang';

import type {
  SerializedRemoteObjectCall,
  SerializedRemoteObjectCallResult,
} from '../library/index.js';
import {Remote, RemoteObject} from '../library/index.js';

test('remote', async () => {
  const remote = new Remote();

  const object_1 = {
    foo: 'abc',
    bar: 123,
    pia() {
      return this.foo + this.bar;
    },
  };

  const serialized_1 = remote.serialize(object_1);

  expect(serialized_1).toMatchInlineSnapshot(`
{
  "methods": [
    "pia",
  ],
  "values": {
    "bar": 123,
    "foo": "abc",
  },
}
`);

  await expect(
    remote.call(object_1, {
      method: 'pia',
      args: [],
    }),
  ).resolves.toMatchInlineSnapshot(`
{
  "return": "abc123",
}
`);
});

test('remote object', async () => {
  const object_1 = {
    foo: 'abc',
    bar: 123,
    pia() {
      return this.foo + this.bar;
    },
  };

  class Remote_1 extends RemoteObject<typeof object_1> {
    protected override async call({
      method,
      args,
    }: SerializedRemoteObjectCall): Promise<SerializedRemoteObjectCallResult> {
      return {
        return: await (object_1 as any)[method](...args),
      };
    }
  }

  const remote = new Remote();

  const remote_1 = new Remote_1(remote.serialize(object_1));

  const remoteObject_1 = remote_1.create();

  const piaResult = remoteObject_1.pia();

  await expect(piaResult).resolves.toMatchInlineSnapshot(`"abc123"`);

  type _assert = AssertTrue<IsEqual<typeof piaResult, Promise<string>>>;
});
