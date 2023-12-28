import { OperatorFunction } from "../signal";

export function id<T>(): OperatorFunction<T, T> {
    return v => ({ type: 'value', value: v })
}
