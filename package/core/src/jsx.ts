import { JSX } from ".";

export class JsxElement<P = {}> {
    constructor(public type: JSX.ElementType<P>, public props: P, public key?: any) { }
}

export function jsx<P>(type: JSX.ElementType<P>, props: P, key?: any): JsxElement<P> {
    return new JsxElement<P>(type, props, key)
}
