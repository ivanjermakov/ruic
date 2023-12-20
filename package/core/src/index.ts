import { Component } from './component';
export import JSX = JSX

import { JSX } from './jsx-internal';

export function render(jsx: JSX.Element, root: HTMLElement): void {
    console.log('render!', jsx)
    typeof jsx.type === 'function'
        ? renderComponent(new jsx.type(), root)
        : createIntrinsic(jsx, root)
}

function renderComponent<P>(component: Component<P>, root: HTMLElement): void {
    render(component.render(), root)
}

function createIntrinsic(jsx: JSX.Element, root: HTMLElement): void {
    const el = document.createElement(<string>jsx.type)
    const props = (<any>jsx).props
    const children = props['children']
    if (children) {
        renderChildren(children, el)
    }
    Object.entries(props)
        .filter(([k,]) => k !== 'children')
        .forEach(([prop, value]) => (<any>el)[prop] = value)
    root.appendChild(el)
}

export function renderChildren(children: any, root: HTMLElement): void {
    if (typeof children === 'string') {
        root.innerHTML = children
    } else if (Array.isArray(children)) {
        children.forEach(c => render(c, root))
    } else {
        render(children, root)
    }
}
