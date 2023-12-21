import { Component } from '@yaul/core/component'
import { Button } from './button'

export class App extends Component<{}> {
    override render() {
        console.log('render me!')
        return <div className="app">
            <h1 id="hello">Hello!</h1>
            <h2>This is me!</h2>
            <Button onClick={console.log}>{'My favorite button!'}</Button>
        </div>
    }
}
