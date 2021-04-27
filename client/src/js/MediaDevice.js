import _ from 'lodash';
import Emitter from './Emitter';

/**
 * Manage all media devices
 */
class MediaDevice extends Emitter {
  /**
   * Start media devices and send stream
   */
  start() {
    const constraints = {
      video: {
        facingMode: 'user',
        // height: { min: 120, ideal: 480, max: 1080 },
        height: {max: 360},
        frameRate: {
          min: 1,
          max: 30
      }
        // height: {max: 360}
      },
      audio: {
        echoCancellation: true
      }
    };

    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((stream) => {
        this.stream = stream;
        this.emit('stream', stream);
      })
      .catch((err) => {
        if (err instanceof DOMException) {
          alert('Cannot open webcam and/or microphone');
          console.log(err);
        } else {
          console.log(err);
        }
      });

    return this;
  }

  /**
   * Turn on/off a device
   * @param {String} type - Type of the device
   * @param {Boolean} [on] - State of the device
   */
  toggle(type, on) {
    const len = arguments.length;
    if (this.stream) {
      this.stream[`get${type}Tracks`]().forEach((track) => {
        const state = len === 2 ? on : !track.enabled;
        _.set(track, 'enabled', state);
      });
    }
    return this;
  }

  /**
   * Stop all media track of devices
   */
  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    return this;
  }
}

export default MediaDevice;
