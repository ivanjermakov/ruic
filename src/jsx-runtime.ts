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

    children(): JSX.Element[] {
        const ps = <any>this.props
        return 'children' in ps
            ? <JsxElement[]>ps.children
            : []
    }

    render(root: HTMLElement) {
        if (typeof this.type === "string") {
            this.createIntrinsic(root)
        } else {
            const comp = new this.type(this.props)
            comp.render().render(root)
        }
    }

    createIntrinsic(root: HTMLElement): void {
        const el = document.createElement(<string>this.type)

        const children = this.children()
        if (children) {
            console.log(children)
            for (const c of children) {
                if (typeof c === 'string') {
                    el.innerHTML += c
                } else {
                    c.render(el)
                }
            }
        }

        Object.entries(<any>this.props)
            .filter(([k]) => k.startsWith('on'))
            .forEach(([prop, value]) => {
                return el.addEventListener(prop.slice(2).toLowerCase(), <EventListenerOrEventListenerObject>value)
            })

        Object.entries(<any>this.props)
            .filter(([k]) => k !== "children")
            .forEach(([prop, value]) => ((<any>el)[prop] = value))

        root.appendChild(el)
    }
}

export function jsx<P>(type: JsxElementType<P>, props: P, key?: any): JsxElement<P> {
    return new JsxElement<P>(type, props, key)
}

export const jsxs = jsx
