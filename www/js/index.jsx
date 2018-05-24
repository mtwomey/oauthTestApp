let events = new EventEmitter();

let global = {};

function log (message){
    events.emit('log', {timestamp: new Date().toLocaleString(), source: 'CLIENT', message: message});
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

        axios.put('/oauth2/target', {oauthTarget: global.oauthTarget}); // Make sure the target is there

        log('Getting login URL from the server (which also generates and saves an oauth STATE on the server)');
        this.state.win = window.open('', '_blank', 'height=500,width=500'); // Opening a blank window first to be redirected in the async - this avoids pop-up blocking
        axios.get(`/loginUrl/${global.oauthTarget}`)
            .then(result => {
                log(`Opening a new window to "${result.data}"`);
                this.state.win.location.replace(result.data); // Redirecting the window to auth0
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
        axios.put('/oauth2/target', {oauthTarget: global.oauthTarget}); // This has to come after deleteAllCookies
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
            logLineId: 0
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
        let newContents = this.state.logEntries;
        newContents.push(Object.assign({id: this.getLogLineId()}, logEntry));
        this.setState({logEntries: newContents});
    }

    scrollToBottom = () => {
        this.messagesEnd.scrollIntoView({ behavior: "smooth" });
    };

    componentDidUpdate() {
        this.scrollToBottom();
    }

    render() {
        let styleSourceTag = {
            color: '#4CAF50'
        };

        let styleTimestampTag = {
            color: '#00bcd4'
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

        let logMessages = this.state.logEntries.map(logEntry => {
            return <li key={logEntry.id} style={styleListItem}><span style={styleTimestampTag}>[{logEntry.timestamp}]</span> <span style={styleSourceTag}>[{logEntry.source}]</span> {logEntry.message}</li>
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
        axios.put('/oauth2/target', {oauthTarget: global.oauthTarget});
        log(`Changing target oauth to ${global.oauthTarget}`);
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
    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
}

function getOauthConfigs(){
    return axios.get('/oauth2/configs')
        .then(response => {
            global.oauthTargets = response.data;
        })
}

function setInitialOauthTarget(){
    return axios.put('/oauth2/target', {oauthTarget: global.oauthTargets[0]})
}

function preLoadData(){
    return Promise.all([ // Do this stuff first, all at once
        getOauthConfigs()
    ])
    .then(() => { // Then do this stuff
        setInitialOauthTarget();
    })
}

function startReact(){
    preLoadData()
        .then(() => {
            ReactDOM.render(
                <OauthTest/>,
                document.getElementById('root')
            );
        });
}

startReact();

