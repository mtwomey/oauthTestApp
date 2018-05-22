let events = new EventEmitter();

function log (message){
    events.emit('log', message);
}

setInterval(() => {
    axios.get('/signals')
        .then(result => {
            if (result.data.length > 0) {
                result.data.forEach(signal => {
                    events.emit(signal);
                })
            }
        });
}, 1000);

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
        log('Getting login URL from the server (which also generates and saves an oauth STATE on the server)');
        axios.get('/loginUrl')
            .then(result => {
                log(`Opening a new window to "${result.data}"`);
                this.state.win = window.open(result.data, '_blank', 'height=500,width=500');
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
            contents: [],
            logLineId: 0
        };

        events.on('log', messageText => {
            this.addlogs('CLIENT', [messageText]);
        });

        events.on('clearLog', () => {
            this.setState({contents: []});
        });

        setInterval(() => {
            axios.get('/logs')
                .then(result => {
                    if (result.data.length > 0) {
                        this.addlogs('SERVER', result.data);
                    }
                });
        }, 2000);
    }


    getLogLineId(){
        return this.state.logLineId++;
    }

    addlogs(source, logs) {
        let newContents = this.state.contents;
        newContents = newContents.concat(logs.map(messageText => {
            return {id: this.getLogLineId(), source: source, message: messageText};
        }));
        this.setState({contents: newContents});
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

        let logMessages = this.state.contents.map(message => {
            return <li key={message.id} style={styleListItem}><span style={styleSourceTag}>[{message.source}]</span> {message.message}</li>
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

class OauthTest extends React.Component {
    render() {
        return (
            <div>
                <LoginButton/><ClearButton/>
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

ReactDOM.render(
    <OauthTest/>,
    document.getElementById('root')
);


