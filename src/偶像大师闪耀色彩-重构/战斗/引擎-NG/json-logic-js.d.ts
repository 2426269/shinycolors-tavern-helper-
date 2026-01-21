// Type declarations for json-logic-js
declare module 'json-logic-js' {
  interface JsonLogic {
    apply(logic: any, data?: any): any;
    add_operation(name: string, code: (...args: any[]) => any): void;
    rm_operation(name: string): void;
    is_logic(logic: any): boolean;
    truthy(value: any): boolean;
    get_operator(logic: any): string | null;
    get_values(logic: any): any;
    uses_data(logic: any): string[];
  }

  const jsonLogic: JsonLogic;
  export = jsonLogic;
}
