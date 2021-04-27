import React, { Component } from 'react';
import  { withRouter, Link } from 'react-router-dom';
import { auth } from 'firebase';
import { connect } from 'react-redux';
import { CircularProgress } from '@material-ui/core';

class Signup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      password_again: '',
      error: '',
      loading: false
    };
    this.submit = this.submit.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount() {
    localStorage.removeItem('index');
    localStorage.removeItem('username');
  }

  async submit(e) {
    e.preventDefault();
    const { username, password } = this.state;
    await this.setState({ loading: true });
    auth().createUserWithEmailAndPassword(username, password).then((ev) => {
      console.log(ev);
    }).catch((error) => {
      this.setState({ error: error.message });
    })
      .finally(() => {
        this.setState({ loading: false });
      });
  }

  handleChange(e) {
    const { name, value } = e.target;
    this.setState({[name]: value});
  }

  render() {
    if (this.props.user.uid) this.props.history.push('/');
    const { error, username, password, password_again, loading } = this.state;
    return (
      <div className="signup-container">
      <div className="form">
        <div className="form-toggle"></div>
          <div className="form-panel one">
            <div className="form-header">
              <h1>
              User Signup
              </h1>
            </div>
            <div className="form-content">
              <form>
                <div className="form-group">
                  <label htmlFor="username">Email</label><input id="username" name="username" value={username} onChange={this.handleChange} required="" type="text"/>
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label><input id="password" name="password" value={password} onChange={this.handleChange} required="" type="password"/>
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password Again</label><input id="password" name="password_again" value={password_again} onChange={this.handleChange} required="" type="password"/>
                </div>
                {/* <div className="form-group">
                  <label className="form-remember"><input type="checkbox" />Remember Me</label><a className="form-recovery" href="#">Forgot Password?</a>
                </div> */}
                <div className="form-group">
                  <button type="submit" onClick={loading ? null : this.submit}>
                    {
                      loading ?
                        <CircularProgress style={{ color: '#fff', height: '1rem', width: '1rem' }} />
                        : 'Sign Up'
                    }
                  </button>
                </div>
                <span style={{color: 'red'}}>{error}</span>
              </form>
              <Link to='/login'>Sign In with existing account</Link>
            </div>
          </div>
          <div className="form-panel two">
          </div>
      </div>
      </div>
    );
  }
}

const mapStateToProps = ({user}) => ({
  user,
});

export default withRouter(connect(mapStateToProps)(Signup));
