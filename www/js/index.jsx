let events = new EventEmitter();

let global = {};

function log (message){
    events.emit('log', {timestamp: new Date().getTime(), source: 'CLIENT', message: message});
}

function getLogs() {
    return axios.get('/logs')
        .then(result => {
            if (result.data.length > 0) {
                result.data.forEach(logEntry => {
                    events.emit('log', logEntry);
                });
            }
        });
}

function getSignals() {
    return axios.get('/signals')
        .then(result => {
            if (result.data.length > 0) {
                result.data.forEach(signal => {
                    events.emit(signal);
                })
            }
        });
}

function waitForSignal(signal){
    return new Promise((resolve, reject) => {
        events.once(signal, () => {
            resolve();
        })
    });
}

class Poller {

    constructor(){
        this.pollingOn = false;
        this.pollingEndTime = 0;
        this.interval = null;
        this.watcher = null;
    }

    getRemainingTime(){
        return this.pollingEndTime - new Date().getTime();
    }

    startPolling(duration, frequency) {
        if (this.pollingOn) { // If the poller is already running, just extend the time if necessary
            let extendedTime = duration - this.getRemainingTime();
            if (extendedTime > 0) {
                this.pollingEndTime = this.pollingEndTime + extendedTime;
            }
        } else {
            this.pollingOn = true;
            this.pollingEndTime = new Date().getTime() + duration;

            let pollingFrequency = frequency || 1000;

            this.interval = setInterval(() => {
                getLogs();
                getSignals();
            }, pollingFrequency);

            this.watcher = setInterval(() => { // Stop all polling once the endTime is reached
                if (new Date().getTime() > this.pollingEndTime) {
                    clearInterval(this.interval);
                    clearInterval(this.watcher);
                    this.pollingOn = false;
                }
            }, 1000);
        }
    }
}

let poller = new Poller();

class LoginButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        this.handleClick = this.handleClick.bind(this);

        events.on('CloseOauthWindow', () => {
            this.state.win.close();
        });
    }

    handleClick() {

        // Start polling
        poller.startPolling(120000);

        this.state.win = window.open('', '_blank', 'height=500,width=500'); // Opening a blank window first to be redirected in the async - this avoids pop-up blocking (not doing it inside an async callback
        setOauthTarget() // Make sure the target is there
            .then(() => {
                log('Getting login URL from the server (which also generates and saves an oauth STATE on the server)');
                axios.get(`/loginUrl/${global.oauthTarget}`)
                    .then((result) => {
                        log(`Opening a new window to "${result.data}"`);
                        this.state.win.location.replace(result.data); // Redirecting the window to auth0
                    });
            });
    }

    render() {
        let styleButton = {
            margin: '0 10px 10px 0',
            fontSize: '1em',
            backgroundColor: '#1cb841',
            color: 'white',
            borderRadius: '5px'
        };

        return (
            <button onClick={this.handleClick} style={styleButton}>Login</button>
        );
    }
}

class ClearButton extends React.Component {

    handleClick() {
        events.emit('clearLog');
        axios.delete('/session');
        deleteAllCookies();
        setOauthTarget(); // This has to come after deleteAllCookies
        poller.startPolling(5000);
    }

    render() {
        let styleButton = {
            margin: '0 10px 10px 0',
            fontSize: '1em',
            backgroundColor: '#df7514',
            color: 'white',
            borderRadius: '5px'
        };


        return(
            <button onClick={this.handleClick} style={styleButton}>Clear Everything</button>
        )
    }
}

class LogWindow extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            logEntries: [],
            logLineId: 1
        };

        events.on('log', logEntry => {
            this.addLog(logEntry);
        });

        events.on('clearLog', () => {
            this.setState({logEntries: []});
        });
    }


    getLogLineId(){
        return this.state.logLineId++;
    }

    addLog(logEntry) {
        let idLogEntry = Object.assign({id: this.getLogLineId()}, logEntry);
        this.setState((prevState) => {
            let logEntries = prevState.logEntries;
            logEntries.push(idLogEntry);
            return ({logEntries: logEntries});
        })
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    };

    componentDidUpdate() {
        this.scrollToBottom();
    }

    render() {
        let styleSourceTag01 = {
            color: '#4CAF50'
        };

        let styleSourceTag02 = {
            color: '#978cea'
        };

        let styleTimestampTag = {
            color: '#00bcd4'
        };

        let styleIdTag = {
            color: '#d4c700'
        };

        let styleDiv = {
            background: 'black',
            color: '#CECECE',
            listStyleType: 'none',
            padding: '10px',
            margin: 0,
            fontSize: '.8em',
            whiteSpace: 'pre-wrap',
            overflow: 'auto',
            height: '400px'
        };

        let styleList = {
            listStyleType: 'none',
            margin: '0 0 0 0',
            padding: '0 0 0 0'
        };

        let styleListItem = {
            margin: '0 0 0 0',
            padding: '0 0 5px 0'
        };

        this.state.logEntries.sort((a, b) => a.timestamp - b.timestamp);
        let logMessages = this.state.logEntries.map((logEntry, index) => {
            let styleSourceTag;
            if (logEntry.source === 'CLIENT') {
                styleSourceTag = styleSourceTag01;
            }
            if (logEntry.source === 'SERVER') {
                styleSourceTag = styleSourceTag02;
            }
            return <li key={logEntry.id} style={styleListItem}><span style={styleIdTag}>[{('00' + (index +1)).slice(-3)}]</span> <span style={styleTimestampTag}>[{new Date(logEntry.timestamp).toLocaleString()}]</span> <span style={styleSourceTag}>[{logEntry.source}]</span> {logEntry.message}</li>
        });

        return (
            <div style={styleDiv}>
                <ul style={styleList}>
                    {logMessages}
                </ul>
                <div style={{ float:"left", clear: "both" }}
                     ref={(el) => { this.messagesEnd = el; }}>
                </div>
            </div>
        )
    }
}

class OauthTargetSelector extends React.Component {
    constructor(props) {
        super(props);
        this.state = {

        };

        global.oauthTarget = global.oauthTargets[0];

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event){
        global.oauthTarget = event.target.value;
        poller.startPolling(5000);
        setOauthTarget();
    }

    render() {
        let styleDropdown = {
            fontSize: '1em',
            backgroundColor: '#6495ed',
            color: 'white',
            margin: '0 10px 10px 0'
        };

        let configOptions = global.oauthTargets.map((config, i) => {
            return <option key={i} value={config}>{config}</option>
        });

        return (
            <select onChange={this.handleChange} style={styleDropdown}>
                {configOptions}
            </select>
        )
    }
}

class OauthTest extends React.Component {
    render() {
        return (
            <div>
                <LoginButton/><ClearButton/><OauthTargetSelector/>
                <LogWindow/>
            </div>
        );
    }
}

function deleteAllCookies() {
    let cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        let eqPos = cookie.indexOf("=");
        let name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

function getOauthConfigs(){
    return axios.get('/oauth2/configs')
        .then(response => {
            global.oauthTargets = response.data;
        })
}

function setOauthTarget(oauthTarget){
    let target = oauthTarget || global.oauthTarget;
    log(`Requesting target change to ${target}`);
    return axios.put('/oauth2/target', {oauthTarget: target});
}

function preLoadData(){
    return Promise.all([ // Do this stuff first, all at once
        getOauthConfigs()
    ])
    .then(() => { // Then do this stuff
        setOauthTarget(global.oauthTargets[0]);
    })
}

function startReact(){
    preLoadData()
        .then(() => {
            ReactDOM.render(
                <OauthTest/>,
                document.getElementById('root')
            );
            poller.startPolling(10000);
        });
}

waitForSignal('CloseOauthWindow')
    .then(() => {
        console.log('I got the signal');
    });
startReact();

