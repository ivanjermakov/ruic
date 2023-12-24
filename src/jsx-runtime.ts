import { JsxElement, JsxElementType } from "./jsx-element"

export function jsx<P extends JSX.HTMLAttributes>(type: JsxElementType<P>, props: P, key?: any): JsxElement<P> {
    return new JsxElement(type, props, key)
}

export const jsxs = jsx
