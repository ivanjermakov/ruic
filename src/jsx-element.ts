import { Component } from './component'
import { Signal } from './signal'

export type JsxComponentType<P extends JSX.HTMLAttributes> = new (props: P) => Component<P>

export type JsxElementType<P extends JSX.HTMLAttributes> = string | JsxComponentType<P>

export class JsxElement<P extends JSX.HTMLAttributes> {

    root?: HTMLElement
    element?: HTMLElement
    component?: Component<P>
    componentElement?: JSX.Element

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
            ? <JsxElement<any>[]>ps.children
            : []
    }

    render(root: HTMLElement): void {
        const rerender = this.element !== undefined
        if (rerender) {
            console.debug('rerender', this.element)
        }
        this.root = root
        if (typeof this.type === 'string') {
            this.renderIntrinsic(rerender)
        } else {
            this.renderComponent()
        }
    }

    private renderIntrinsic(rerender: boolean): void {
        const el = document.createElement(<string>this.type)

        const children = this.children()
        if (children) {
            for (const c of children) {
                this.renderChild(c, el)
            }
        }

        Object.entries(<any>this.props)
            .filter(([k]) => k.startsWith('on'))
            .forEach(([prop, value]) => el.addEventListener(
                prop.slice(2).toLowerCase(),
                <EventListenerOrEventListenerObject>value
            ))

        Object.entries(<any>this.props)
            .filter(([k]) => k !== 'children')
            .forEach(([prop, value]) => {
                if (prop === 'class') {
                    ((<any>el).className = value)
                } else {
                    ((<any>el)[prop] = value)
                }
            })

        if (rerender) {
            this.root!.insertBefore(el, this.element!)
            this.element!.remove()
            this.element = el
        } else {
            this.element = el
            this.root!.appendChild(this.element)
        }
    }

    private renderComponent(): void {
        if (typeof this.type === 'string') return
        this.component = new this.type(this.props)
        this.componentElement = this.component.render()
        this.componentElement.render(this.root!)
    }

    private renderChild(c: any, el: HTMLElement): void {
        if (Array.isArray(c)) {
            c.forEach(sc => this.renderChild(sc, el))
        } else if (c instanceof Signal) {
            const cv = c.get()
            this.renderChild(cv, el)
            c.once(() => this.render(this.root!))
        } else if (typeof c === 'string' || typeof c === 'number') {
            el.innerHTML += c
        } else if (c instanceof JsxElement) {
            c.render(el)
        } else {
            console.warn('unexpected child', c)
        }
    }

}

