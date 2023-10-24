export type SerializedRemoteObject = {
  values: Record<string, unknown>;
  methods: string[];
};

export type SerializedRemoteObjectCall = {
  method: string;
  args: unknown[];
};

export type SerializedRemoteObjectCallResult =
  | {return: unknown}
  | {throw: string};
