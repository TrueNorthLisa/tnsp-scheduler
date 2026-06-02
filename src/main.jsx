import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  componentDidCatch(error) { this.setState({ error }); }
  render() {
    if (this.state.error) return (
      <div style={{padding:40,fontFamily:"monospace",background:"#1a0000",color:"#ff6666",minHeight:"100vh"}}>
        <h2>React Error</h2>
        <pre style={{whiteSpace:"pre-wrap"}}>{this.state.error.toString()}</pre>
        <pre style={{whiteSpace:"pre-wrap",fontSize:11,color:"#ff9999"}}>{this.state.error.stack}</pre>
      </div>
    );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary><App /></ErrorBoundary>
)
