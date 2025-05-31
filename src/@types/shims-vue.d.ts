declare module "*.vue" {
  const Component: import("vue").DefineComponent;
  export default Component;
}

type JSONValue =
  | null
  | boolean
  | string
  | number
  | JSONValue[]
  | Record<string, JSONValue>;
