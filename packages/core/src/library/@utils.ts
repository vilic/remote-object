export const hasOwnProperty = Object.prototype.hasOwnProperty;

export function getObjectPrototypes(object: object): object[] {
  const prototypes: object[] = [];

  let prototype = Object.getPrototypeOf(object);

  while (prototype !== null && prototype !== Object.prototype) {
    prototypes.push(prototype);

    prototype = Object.getPrototypeOf(prototype);
  }

  return prototypes;
}
