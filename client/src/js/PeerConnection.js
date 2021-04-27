import MediaDevice from './MediaDevice';
import Emitter from './Emitter';
import socket from './socket';

// const PC_CONFIG = { iceServers: [{ urls: ['turn:numb.viagenie.ca'], "username": "pal.vishal41@gmail.com", "credential": "@WqMLF23VtbBPZS" }] };

const PC_CONFIG = { iceServers: [{ urls: ['stun:stun.l.google.com:19302', 'turn:numb.viagenie.ca'], "username": "pal.vishal41@gmail.com", "credential": "@WqMLF23VtbBPZS" }] };

class PeerConnection extends Emitter {
  /**
     * Create a PeerConnection.
     * @param {String} friendID - ID of the friend you want to call.
     * @param {String} callId
     */

  constructor(friendID, callId) {
    super();
    this.pc = new RTCPeerConnection(PC_CONFIG);
    this.pc.onicecandidate = event => socket.emit('call', {
      to: this.friendID,
      callId: this.callId,
      candidate: event.candidate
    });
    // this.pc.oniceconnectionstatechange = e => console.log('state change-----------------------------------',e);
    this.pc.ontrack = event => this.emit('peerStream', event.streams[0]);

    this.mediaDevice = new MediaDevice();
    this.friendID = friendID;
    this.callId = callId;
  }

  /**
   * Starting the call
   * @param {Boolean} isCaller
   * @param {Object} config - configuration for the call {audio: boolean, video: boolean}
   */
  start(isCaller, config) {
    this.mediaDevice
      .on('stream', (stream) => {
        stream.getTracks().forEach((track) => {
          this.pc.addTrack(track, stream);
        });
        this.emit('localStream', stream);
        if (isCaller) socket.emit('request', { to: this.friendID, callId: this.callId });
        else this.createOffer();
      })
      .start(config);

    return this;
  }

  /**
   * Stop the call
   * @param {Boolean} isStarter
   */
  stop(isStarter) {
    if (isStarter) {
      socket.emit('end', { to: this.friendID });
    }
    this.mediaDevice.stop();
    this.pc.close();
    this.pc = null;
    this.off();
    return this;
  }

  createOffer() {
    this.pc.createOffer()
      .then(this.getDescription.bind(this))
      .catch(err => console.log(err));
    return this;
  }

  createAnswer() {
    this.pc.createAnswer()
      .then(this.getDescription.bind(this))
      .catch(err => console.log(err));
    return this;
  }

  getDescription(desc) {
    this.pc.setLocalDescription(desc);
    socket.emit('call', { to: this.friendID, callId: this.callId, sdp: desc });
    return this;
  }

  /**
   * @param {Object} sdp - Session description
   */
  setRemoteDescription(sdp) {
    const rtcSdp = new RTCSessionDescription(sdp);
    this.pc.setRemoteDescription(rtcSdp);
    return this;
  }

  /**
   * @param {Object} candidate - ICE Candidate
   */
  addIceCandidate(candidate) {
    if (candidate) {
      const iceCandidate = new RTCIceCandidate(candidate);
      this.pc.addIceCandidate(iceCandidate);
    }
    return this;
  }

  async replaceTrack(stream) {
    var sender = this.pc.getSenders().find(function(s) {
      return s.track.kind == stream.kind;
    });
    sender.replaceTrack(stream);
    let sdp = await this.pc.createOffer();
    this.pc.setLocalDescription(sdp);
  }
}

export default PeerConnection;
