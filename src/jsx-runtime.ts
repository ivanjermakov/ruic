import { Component } from "./component"

export type JsxComponentType<P> = new (props?: P) => Component<P>

export type JsxElementType<P> = string | JsxComponentType<P>

export class JsxElement<P = {}> {
    constructor(
        public type: JsxElementType<P>,
        public props: P,
        public key?: any
    ) {
        const ps = <any>props
        if ('children' in ps && !Array.isArray(ps.children)) {
            ps.children = [ps.children]
        }
    }
}

export function jsx<P>(type: JsxElementType<P>, props: P, key?: any): JsxElement<P> {
    return new JsxElement<P>(type, props, key)
}

export const jsxs = jsx
