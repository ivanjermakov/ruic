import { Signal } from 'ruic'
import { Component } from 'ruic/component'
import './styles.css'

export class App extends Component {

    count = new Signal(0)

    handleClick() {
        console.log('click!')
        this.count.update(v => v + 1)
    }

    override render() {
        return <div className="app">
            <h1 id="hello">Welcome to Ruic!</h1>
            <p>Count: {this.count}</p>
            <Button onClick={() => this.handleClick()}>{'My favorite button!'}</Button>
        </div>
    }

}

type ButtonProps = Pick<JSX.HTMLAttributes, 'onClick' | 'children'>

export class Button extends Component<ButtonProps> {

    override render() {
        return <button type="button" onClick={this.props.onClick}>{this.props.children}</button>
    }

}
