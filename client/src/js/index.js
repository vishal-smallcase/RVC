import React, { Component } from 'react';
import { render } from 'react-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import { createStore, compose } from "redux";
import { Provider } from 'react-redux';
import rootReducer from './reducers';
import App from './app';

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  composeEnhancers()
);

class Index extends Component {
    render() {
        return (
            <Provider store={store}>
                <Router>
                    <App />
                </Router>
            </Provider>
        );
    }
}

render(<Index />, document.getElementById('root'));