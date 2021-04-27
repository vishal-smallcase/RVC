import React, { useState } from 'react';
import { useHistory } from "react-router-dom";
import { useSelector } from 'react-redux';
import { database } from './firebase';
import PropTypes from 'proptypes';
import { geolocated } from 'react-geolocated';
import axios from 'axios';
import { TextField } from '@material-ui/core';

function MainWindow({ startCall, setCallId, socketId, ...props }) {
  /**
   * Start the call with or without video
   * @param {Boolean} video
   */

  const [friendId, setFriendId] = useState('');

  const UUID = () => {
    let dt = new Date().getTime();
    let uuid = 'xxxxxxxx'.replace(/[x]/g, function(c) {
        let r = (dt + Math.random()*16)%16 | 0;
        dt = Math.floor(dt/16);
        return (c=='x' ? r :(r&0x3|0x8)).toString(16);
    });
    return uuid;
  }

  const uid = useSelector(state => state.user.uid);

  const callWithVideo = async () => {
    const config = { audio: true, video: true };

    if (friendId === socketId) {
      alert('Please don\'t call yourself');
      return;
    }
    if (friendId) {
      const callId = UUID();
      setCallId(callId);
      database.ref('calls/' + callId).set({
        user1: socketId,
        active: 1
      });
      startCall(true, friendId, callId, config);
    }
  };

  const changeFriendId = e => {
    setFriendId(e.target.value);
  }

  let history = useHistory();
  // if (!userId || !custId) history.push('/');
  if(!uid) history.push('/login');
  return (
    <div className="container main-window">
      <h3 className="greeting">
        Hi, { socketId }
      </h3>
      <div className="call-box">
        <TextField className="friendid-field" value={friendId} onChange={changeFriendId} label="Enter Friend email ID" />
        <div>
          <button
            type="button"
            className="btn-action fa fa-video-camera"
            onClick={callWithVideo}
          ><span>Call Now</span></button>
        </div>
      </div>
    </div>
  );
}

MainWindow.propTypes = {
  startCall: PropTypes.func.isRequired,
  setCallId: PropTypes.func.isRequired,
  socketId: PropTypes.string.isRequired
};

export default MainWindow;
