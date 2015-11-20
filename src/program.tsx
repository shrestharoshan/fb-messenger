import * as React from 'react';
import * as ReactDom from 'react-dom';
import App from './components/app';
import AutoUpdate from "./services/auto-update";

class Program {
    static main() {
        var autoUpdater = new AutoUpdate();
        autoUpdater.checkForUpdate();
        ReactDom.render(<App />, document.getElementById("fb-messenger"));
    }
}

window['Program'] = Program;

export default Program;