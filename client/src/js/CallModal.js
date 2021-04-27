import React from 'react';
import PropTypes from 'proptypes';
import classnames from 'classnames';
import { database } from './firebase';


function CallModal({ status, callFrom, startCall, rejectCall, type, callId, socketId }) {
  const acceptWithVideo = (video) => {
    const config = { audio: true, video };
    // if(type === 'agent') {
    //   const username = localStorage.getItem('username');
    //   const index = localStorage.getItem('index');
    //   if(username && index) {
    //     database.ref('agents/'+index).update({
    //       active: 0
    //     });
        // database.ref('calls/'+callId).update({
        //   startedOn: isoTime(new Date()),
        //   agent: index,
        // });
    //   }
    // }
    database.ref('calls/'+callId).update({
      user2: socketId,
    });
    startCall(false, callFrom, '', config); 
  };

  const pad = (number) => {
    if (number < 10) {
      return '0' + number;
    }
    return number;
  }

  const isoTime = (date) => {
    return date.getFullYear() +
        '-' + pad(date.getMonth() + 1) +
        '-' + pad(date.getDate()) +
        'T' + pad(date.getHours()) +
        ':' + pad(date.getMinutes()) +
        ':' + pad(date.getSeconds())
  }

  return (
    <div className={classnames('call-modal', status)}>
      <p>
        <span className="caller">{`${callFrom} is calling`}</span>
      </p>
      <button
        type="button"
        className="btn-action fa fa-video-camera"
        onClick={() => acceptWithVideo(true)}
      />
      <button
        type="button"
        className="btn-action fa fa-phone"
        onClick={() => acceptWithVideo(false)}
      />
      <button
        type="button"
        className="btn-action hangup fa fa-phone"
        onClick={rejectCall}
      />
    </div>
  );
}

CallModal.propTypes = {
  status: PropTypes.string.isRequired,
  callFrom: PropTypes.string.isRequired,
  startCall: PropTypes.func.isRequired,
  rejectCall: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  callId: PropTypes.string.isRequired
};

export default CallModal;
