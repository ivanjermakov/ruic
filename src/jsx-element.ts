import { Component } from './component'
import { first } from './operator/first'
import { Signal } from './signal'

export type JsxComponentType<P> = new (props: P) => Component<P>

export type JsxElementType<P> = string | JsxComponentType<P>

export class JsxElement<P> {
    root?: HTMLElement
    element?: HTMLElement
    component?: Component<P>
    componentElement?: JSX.Element
    childMap?: Map<any, HTMLElement>

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
        return 'children' in ps ? <JsxElement<any>[]>ps.children : []
    }

    render(root: HTMLElement): void {
        const rerender = this.element !== undefined
        this.root = root
        if (typeof this.type === 'string') {
            this.renderIntrinsic()
        } else {
            this.renderComponent()
        }
    }

    private renderIntrinsic(): void {
        const el = document.createElement(<string>this.type)

        const children = this.children()
        if (children) {
            for (const c of children) {
                this.renderChild(c, el)
            }
        }

        for (const prop of Object.keys(<any>this.props)) {
            if (prop === 'children') continue
            const value = (<any>this.props)[prop]
            if (prop.startsWith('on')) {
                el.addEventListener(prop.slice(2).toLowerCase(), <EventListenerOrEventListenerObject>value)
            } else {
                this.setAttribute(prop, value, el)
            }
        }

        if (this.element !== undefined) {
            this.element.replaceWith(el)
        } else {
            this.root!.appendChild(el)
        }
        this.element = el
    }

    private renderComponent(): void {
        if (typeof this.type === 'string') {
            console.warn('not a component', this)
            return
        }
        if (!this.component || !this.componentElement) {
            this.component = new this.type(this.props)
            this.componentElement = this.component.render()
        }
        this.componentElement.render(this.root!)
    }

    private renderChild(c: any, el: HTMLElement): void {
        if (Array.isArray(c)) {
            c.forEach(sc => this.renderChild(sc, el))
        } else if (c instanceof Signal) {
            const cv = c.get()
            this.renderChild(cv, el)
            c.pipe(first()).subscribe(() => this.render(this.root!))
        } else if (typeof c === 'string' || typeof c === 'number') {
            const t = document.createTextNode(c.toString())
            el.appendChild(t)
        } else if (c instanceof JsxElement) {
            c.render(el)
        } else {
            console.warn('unexpected child', c)
        }
    }

    private setAttribute(prop: string, value: any, el: HTMLElement): void {
        let v = value
        if (value instanceof Signal) {
            v = Signal.unwrap(value)
            value.subscribe(v => this.setAttribute(prop, v, el))
        }
        if (prop === 'class') {
            el.className = v
        } else {
            ; (<any>el)[prop] = v
        }
    }
}
