import { Component } from "./component"

export * from "./jsx"

export function render(jsx: JSX.Element, root: HTMLElement): void {
    console.log("render!", jsx)
    typeof jsx.type === "function" ? renderComponent(new jsx.type(jsx.props), root) : createIntrinsic(jsx, root)
}

function renderComponent<P>(jsx: Component<P>, root: HTMLElement): void {
    render(jsx.render(), root)
}

function createIntrinsic(jsx: JSX.Element, root: HTMLElement): void {
    const el = document.createElement(<string>jsx.type)
    const children = jsx.props["children"]
    if (children) {
        renderChildren(children, el)
    }
    Object.entries(jsx)
        .filter(([k]) => k !== "children")
        .forEach(([prop, value]) => ((<any>el)[prop] = value))
    root.appendChild(el)
}

export function renderChildren(children: any, root: HTMLElement): void {
    if (typeof children === "string") {
        root.innerHTML = children
    } else if (Array.isArray(children)) {
        children.forEach((c) => render(c, root))
    } else {
        render(children, root)
    }
}
