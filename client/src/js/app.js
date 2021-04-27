import React, { Component } from 'react';
import _ from 'lodash';
import { Switch, Route, Link, useLocation, withRouter } from 'react-router-dom';
import axios from 'axios';
import { connect } from 'react-redux';
import DetectRTC from 'detectrtc';
import { Snackbar } from '@material-ui/core';
import { auth } from 'firebase';
import MuiAlert from '@material-ui/lab/Alert';

import socket1 from './socket';
import PeerConnection from './PeerConnection';
import MainWindow from './MainWindow';
import CallWindow from './CallWindow';
import CallModal from './CallModal';
import Login from './Login';
import Signup from './Signup';
import { database } from './firebase';

import { loginSuccess } from './actions';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: socket1,
      clientId: '',
      callWindow: '',
      callModal: '',
      callFrom: '',
      localSrc: null,
      peerSrc: null,
      type: '',
      logo: '',
      facingMode: 'user',
      ipAddress: ''
    };
    this.pc = {};
    this.config = null;
    this.startCallHandler = this.startCall.bind(this);
    this.endCallHandler = this.endCall.bind(this);
    this.rejectCallHandler = this.rejectCall.bind(this);
    this.setCallId = this.setCallId.bind(this);
    this.checkRTCSupport = this.checkRTCSupport.bind(this);
    this.changeCamera = this.changeCamera.bind(this);
    this.renderOffline = this.renderOffline.bind(this);
    this.setSocket = this.setSocket.bind(this);
    this.endCall = this.endCall.bind(this);
    this.setIpAddress = this.setIpAddress.bind(this);
  }

  async componentDidMount() {
    const { socket } = this.state;
    auth().onAuthStateChanged(async (user) => {
      if (user) {
        await this.props.loginSuccess({ uid: user.uid, email: user.email });
        this.props.history.push('/');
        socket.emit('init', user.email);
      } else {
        await this.props.loginSuccess({ uid: '' });
      }
    });
    this.checkRTCSupport();
    await this.setState({ type: 'user' });
    Notification.requestPermission();
    socket
      .on('init', ({ id: clientId }) => {
        document.title = 'RVC';
        this.setState({ clientId });
      })
      .on('request', ({ from: callFrom, callId }) => {
        this.setState({ callId });
        this.setState({ callModal: 'active', callFrom });
        this.callNotification();
      })
      .on('call', (data) => {
        if (data.sdp) {
          this.pc.setRemoteDescription(data.sdp);
          if (data.sdp.type === 'offer') this.pc.createAnswer();
        } else this.pc.addIceCandidate(data.candidate);
      })
      .on('reload', () => {
        this.endCall(false);
        window.location = `https://${window.location.hostname}/`;
      })
      .on('end', () => {
        this.setState({ callModal: '' });
        this.endCall(false);
      });
    try {
      const res = await axios.get('https://www.cloudflare.com/cdn-cgi/trace');
      if (res.status === 200) {
        const { data } = res;
        const l = data.split('\n');
        const ip = l[2].split('=')[1];
        console.log(ip);
        this.setState({ ipAddress: ip });
      } else {
        console.log('Couldn\'t get ip');
      }
    } catch (e) {
      console.log(e.message);
    }
  }

  async setSocket(socket) {
    const { callId, type } = this.state;
    const { user } = this.props;
    const username = localStorage.getItem('username');
    const index = localStorage.getItem('index');
    await this.setState({ socket });
    this.state.socket
      .on('init', async ({ id: clientId }) => {
        console.log('initinit--------', clientId);
        document.title = 'RVC';
        const snapshot = await database.ref(`calls/${callId}`).once('value');
        const call = snapshot.val();
        this.setState({ clientId });
        this.pc.pc.createOffer({ iceRestart: true })
          .then((desc) => {
            this.pc.pc.setLocalDescription(desc);
            socket.emit('rehandshake', { callId, sdp: desc });
            console.log('reconneeeeect', this.pc);
          });
      })
      .on('request', ({ from: callFrom, callId }) => {
        this.setState({ callId });
        this.setState({ callModal: 'active', callFrom });
        this.callNotification();
      })
      .on('call', (data) => {
        if (data.sdp) {
          this.pc.setRemoteDescription(data.sdp);
          // console.log('sdp-----------------', data.sdp);
          if (data.sdp.type === 'offer') this.pc.createAnswer();
        } else this.pc.addIceCandidate(data.candidate);
      })
      .on('end', () => {
        this.setState({ callModal: '' });
        this.endCall(false);
      })
      .on('reload', () => {
        this.endCall(false);
        window.location = `https://${window.location.hostname}/`;
      })
      .emit('init', user.email);
  }

  setIpAddress(ipAddress) {
    this.setState({ ipAddress });
  }

  setCallId(id) {
    this.setState({ callId: id });
  }

  checkRTCSupport() {
    DetectRTC.load(() => {
      console.log(DetectRTC);
      if (DetectRTC.hasWebcam && DetectRTC.hasMicrophone && DetectRTC.hasSpeakers && DetectRTC.isWebRTCSupported && DetectRTC.isWebSocketsSupported && !DetectRTC.isWebSocketsBlocked && DetectRTC.isVideoSupportsStreamCapturing) {
        console.log('webrtc supported');
      } else {
        alert('Your browser/device is incompatible with this application. Your KYC might fail.');
      }
    });
  }

  logout() {
    auth().signOut().then(() => {
      console.log('logout');
    }).catch((error) => {
      console.log(error.message);
    });
  }

  startCall(isCaller, friendID, callId, config) {
    this.config = config;
    this.pc = new PeerConnection(friendID, callId)
      .on('localStream', (src) => {
        const newState = { callWindow: 'active', localSrc: src };
        if (!isCaller) newState.callModal = '';
        this.setState(newState);
      })
      .on('peerStream', src => this.setState({ peerSrc: src }))
      .start(isCaller, config);
  }

  async changeCamera() {
    const { localSrc, peerSrc, facingMode } = this.state;
    try {
      localSrc.getVideoTracks()[0].stop();
      const stream = await navigator.mediaDevices.getUserMedia(
        {
          video: {
            facingMode: facingMode === 'user' ? 'environment' : 'user'
          }
        }
      );
      this.setState({ facingMode: facingMode === 'user' ? 'environment' : 'user' });
      const videoTrack = stream.getVideoTracks()[0];
      console.log(this.pc);
      this.pc.replaceTrack(videoTrack);
      this.setState({ localSrc: stream });
    } catch (e) {
      console.log(e);
    }
  }

  rejectCall() {
    const { callFrom, callId, socket } = this.state;
    socket.emit('end', { to: callFrom });
    database.ref(`calls/${callId}`).update({
      active: 0
    });
    this.setState({ callModal: '' });
  }

  pad(number) {
    if (number < 10) {
      return `0${number}`;
    }
    return number;
  }

  isoTime(date) {
    return `${date.getFullYear()
    }-${this.pad(date.getMonth() + 1)
    }-${this.pad(date.getDate())
    }T${this.pad(date.getHours())
    }:${this.pad(date.getMinutes())
    }:${this.pad(date.getSeconds())}`;
  }

  endCall(isStarter) {
    const { type, callId, localSrc } = this.state;
    if (_.isFunction(this.pc.stop)) {
      this.pc.stop(isStarter);
    }
    this.pc = {};
    this.config = null;
    localSrc.getVideoTracks && localSrc.getVideoTracks[0] && localSrc.getVideoTracks[0].stop();
    if (callId) {
      database.ref(`calls/${callId}`).update({
        active: 0
      });
    }
    this.setState({
      callWindow: '',
      callModal: '',
      localSrc: null,
      peerSrc: null
    });
  }

  UUID() {
    let dt = new Date().getTime();
    const uuid = 'xxxxxxxx'.replace(/[x]/g, (c) => {
      const r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }

  renderOffline({ online }) {
    const { callWindow } = this.state;
    if (!online) {
      if (callWindow !== 'active') location.reload();
      else {
        return (
          <Snackbar open>
            <MuiAlert elevation={6} variant="filled" severity="warning">Low bandwidth</MuiAlert>
          </Snackbar>
        );
      }
      return (
        <Snackbar open>
          <MuiAlert elevation={6} variant="filled" severity="warning">You are offline.</MuiAlert>
        </Snackbar>
      );
    }
    return null;
  }

  callNotification() {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
    } else if (Notification.permission === 'granted') {
      const notification = new Notification('Incoming Call');
      notification.onclick = function (e) {
        window.focus();
      };
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          const notification = new Notification('Incoming Call');
          notification.onclick = function (e) {
            window.focus();
          };
        }
      });
    }
  }

  render() {
    const {
      clientId,
      callFrom,
      callModal,
      callWindow,
      localSrc,
      peerSrc,
      type,
      callId,
      logo
    } = this.state;
    const { user } = this.props;
    return (
      <Switch>
        <Route exact path="/">
          <div>
            <nav className="navbar-header">
              <span className="navbar-brand">
                <span className="brand">{logo ? <img className="logo" src={`data:image/png;base64, ${logo}`} /> : null}</span>
              </span>
            </nav>
            {
                  user && user.uid
                    ? <Link to="/login" onClick={this.logout} className="logout">Logout</Link>
                    : null
                }
            {
                  callWindow !== 'active'
                    ? type === 'user'
                      ? (
                        <MainWindow
                          startCall={this.startCallHandler}
                          setCallId={this.setCallId}
                          socketId={this.state.clientId}
                        />
                      )
                      : null
                    : null
                }
            {!_.isEmpty(this.config) && (
            <CallWindow
              status={callWindow}
              localSrc={localSrc}
              peerSrc={peerSrc}
              config={this.config}
              mediaDevice={this.pc.mediaDevice}
              endCall={this.endCallHandler}
              type={type}
              callId={callId}
              changeCamera={this.changeCamera}
              socket={this.state.socket}
              pc={this.pc}
              startCall={this.startCallHandler}
              setUploading={this.setUploading}
              setUploadProgress={this.setUploadProgress}
              setSocket={this.setSocket}
              ipAddress={this.state.ipAddress}
              setIpAddress={this.setIpAddress}
              instruction={this.state.instruction}
            />
            )}
            <CallModal
              status={callModal}
              startCall={this.startCallHandler}
              rejectCall={this.rejectCallHandler}
              callFrom={callFrom}
              type={type}
              callId={this.state.callId}
              socketId={this.state.clientId}
            />
          </div>
        </Route>
        <Route exact path="/signup">
          <>
            <nav className="navbar-header">
              <span className="navbar-brand">
                <span className="brand">{logo ? <img className="logo" src={`data:image/png;base64, ${logo}`} /> : null}</span>
              </span>
            </nav>
            <Signup socketId={clientId} />
          </>
        </Route>
        <Route exact path="/login">
          <>
            <nav className="navbar-header">
              <span className="navbar-brand">
                <span className="brand">{logo ? <img className="logo" src={`data:image/png;base64, ${logo}`} /> : null}</span>
              </span>
            </nav>
            <Login socketId={clientId} />
          </>
        </Route>
      </Switch>
    );
  }
}

const mapStateToProps = ({ user }) => ({
  user
});

export default withRouter(connect(mapStateToProps, {
  loginSuccess
})(App));
