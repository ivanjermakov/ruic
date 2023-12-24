import { Component } from 'ruic/component'
import { Button } from './button'

export class App extends Component {
    clicked: number = 0

    handleClick(e: MouseEvent) {
        this.clicked++
        console.log(e, this.clicked)
    }

    override render() {
        console.log('render me!')
        return <div className="app">
            <h1 id="hello">Hello!</h1>
            <h2>This is me!</h2>
            <Button onClick={e => this.handleClick(e)}>{'My favorite button!'}</Button>
        </div>
    }
}
