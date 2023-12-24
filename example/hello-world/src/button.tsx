import { Component } from 'ruic/component'

type ButtonProps = Pick<JSX.HTMLAttributes, 'onClick' | 'children'>

export class Button extends Component<ButtonProps> {
    override render() {
        return <button type="button" onClick={this.props.onClick}>{this.props.children}</button>
    }
}
