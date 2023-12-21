import { Component } from "./component"

export type JsxComponentType<P> = new () => Component<P>

export type JsxElementType<P> = string | JsxComponentType<P>

export class JsxElement<P = {}> {
    constructor(
        public type: JsxElementType<P>,
        public props: P,
        public key?: any
    ) {}
}

export function jsx<P>(type: JsxElementType<P>, props: P, key?: any): JsxElement<P> {
    return new JsxElement<P>(type, props, key)
}
