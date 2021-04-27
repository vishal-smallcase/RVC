import React, { useState, useEffect, useRef } from 'react';
import { Checkbox, FormControlLabel, Card, CardActions, CardContent, Button, ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, TextField, CircularProgress, FormControl, InputLabel, Select, MenuItem } from '@material-ui/core';
import { NavigateBefore, NavigateNext, ExpandMore, FlipCameraIos, Snackbar } from '@material-ui/icons';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AppBar from '@material-ui/core/AppBar';
import PropTypes from 'proptypes';
import classnames from 'classnames';
import { database } from './firebase';
import axios from 'axios';
import {Detector} from 'react-detect-offline';
import io from 'socket.io-client';
import * as ebml from 'ts-ebml';
import RecordRTC from 'recordrtc';

const getButtonClass = (icon, enabled, color='') => classnames(`btn-action fa ${icon} ${color}`, { disable: !enabled });

function CallWindow({
  peerSrc, 
  localSrc, 
  config, 
  mediaDevice, 
  status, 
  endCall, 
  type, 
  userDetails, 
  question, 
  callId, 
  changeCamera, 
  sendPhotoToAgent, 
  photoFromUser, 
  socket, 
  pc, 
  startCall, 
  uploading, 
  setUploading,
  setUploadProgress, 
  setSocket, 
  ocrData, 
  setOcrData, 
  nsdlData, 
  setNsdlData,
  faceSimilarity,
  setFaceSimilarity,
  ipAddress,
  setIpAddress,
  instruction,
  ...props 
}) {
  const peerVideo = useRef(null);
  const localVideo = useRef(null);
  const [video, setVideo] = useState(config.video);
  const [audio, setAudio] = useState(config.audio);
  const [recording, setRecording] = useState(false);
  const [recorded, setRecorded] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [screenRecordedChunks, setScreenRecordedChunks] = useState([]);
  // const [mediaRecorder, setMediaRecorder] = useState({});
  const [screenRecorder, setScreenRecorder] = useState({});
  const [verifyStatus, setVerifyStatus] = useState(0);
  const [questions_answered, setQuestionsAnswered] = useState(false);
  const [pan_shown, setPanShown] = useState(false);
  const [callStarted, setCallStarted] = useState(false);
  const [livenessVerified, setLivenessVerified] = useState(false);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [pan, setPan] = useState(null);
  const [panPhoto, setPanPhoto] = useState(null);
  const [locationInIndia, setLocationInIndia] = useState(false);
  const [faceXmlLoading, setFaceXmlLoading] = useState(false);
  const [nsdlCheckLoading, setNsdlCheckLoading] = useState(false);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [faceMatchBoolean, setFaceMatchBoolean] = useState(true);
  const [failedSubmissionLoading, setFailedSubmissionLoading] = useState(false);
  const [doctype, setDoctype] = useState('pan');
  const [expanded, setExpanded] = useState('panel1');
  const [docCheckLoading, setDocCheckLoading] = useState(false);
  const [enlargeLocal, setEnlargeLocal] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  const [tabSelected, setTabSelected] = useState(0);
  const [rtcRecorder, setRTCRecorder] = useState({});
  // const callSnapshot = await database.ref('calls/'+callId).once('value');

  // let connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  // connection.addEventListener('change', () => {
  //   console.log('change');
  //   // const socket_new = io(SOCKET_HOST);
  //   // setSocket(socket_new);
  // });

  if(pc && pc.pc) {
    pc.pc.onconnectionstatechange = async () => {
      console.log(pc.pc.connectionState);
      setConnectionState(pc.pc.connectionState);
      if(pc.pc.connectionState === 'failed' && !reconnecting) {
        try {
          let res = await axios.get('https://www.cloudflare.com/cdn-cgi/trace');
          if(res.status === 200) {
            const {data} = res;
            let l = data.split('\n');
            const ip = l[2].split('=')[1];
            if(ip !== ipAddress || !socket.connected) {
              setIpAddress(ip);
              setReconnecting(true);
              const socket_new = io(SOCKET_HOST);
              setSocket(socket_new);
            }
          } else {
            console.log('Ip address fetch failed');
          }
        } catch(e) {
          console.log(e.message);
        }
      } else if(pc.pc.connectionState !== 'failed') {
        setReconnecting(false);
      }
    }
  }

  useEffect(() => {
    if (!callStarted && peerVideo.current && peerSrc) {
      peerVideo.current.srcObject = peerSrc;
      console.log('started');
      setCallStarted(true);
    }
    if(callStarted && callId) {
      database.ref('calls/'+callId).on('value', snapshot => {
        let call = snapshot.val();
        if(call && call.active === 0) {
          beforeEndCall();
        }
      })
    }
    if (localVideo.current && localSrc) localVideo.current.srcObject = localSrc;
    // if(!latitude && !longitude) {
    //   database.ref('calls/'+callId).once('value', snapshot => {
    //     const { location } = snapshot.val();
    //     setLatitude(location.latitude);
    //     setLongitude(location.longitude);
    //     if(parseFloat(location.latitude) >= 8.4 && parseFloat(location.latitude) <= 37.6 && parseFloat(location.longitude) >= 68.7 && parseFloat(location.longitude) <= 97.25) {
    //       setLocationInIndia(true);
    //     }
    //   })
    // }
  });

  const handleExpansionChange = panel => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  useEffect(() => {
    if (mediaDevice) {
      mediaDevice.toggle('Video', video);
      mediaDevice.toggle('Audio', audio);
    }
  });

  // const uploadVideo = async (blob) => {
  //   setUploading(true);
  //   try {
  //     const snapshot = await database.ref('calls/'+callId).once('value');
  //     const { transaction_id, custId } = snapshot.val();
  //     let formData = new FormData();
  //     formData.append('file', blob);
  //     formData.append('userId', transaction_id);
  //     let config = {
  //       onUploadProgress: progressEvent => {
  //         let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
  //         setUploadProgress(percentCompleted);
  //       }
  //     }
  //     let res = await axios.post(`${API_URL}/upload-video`, formData, {...config, headers: {custId}});
  //     if(res && res.data && res.data.status === '200') {
  //       alert('Uploaded');
  //     } else {
  //       alert('Upload Failed');
  //     }
  //   } catch(e) {
  //     alert(e.message);
  //   }
  //   setUploading(false);
  // }

  // const download = async () => {
  //   let blob = new Blob(recordedChunks, {
  //     type: "video/webm"
  //   });
  //   let buff = await blob.arrayBuffer();
  //   const decoder = new ebml.Decoder();
  //   const ebmlElms = decoder.decode(buff);
  //   const reader = new ebml.Reader();
  //   reader.drop_default_duration = false;
  //   ebmlElms.forEach((elm) => {
  //     reader.read(elm);
  //   });
  //   const duration = reader.duration;
  //   reader.stop();
  //   const refinedMetadataBuf = ebml.tools.makeMetadataSeekable(reader.metadatas, reader.duration, reader.cues);
  //   const body = buff.slice(reader.metadataSize);
  //   blob = new Blob([refinedMetadataBuf, body], {type: 'video/webm'});
  //   let url = URL.createObjectURL(blob);
  //   // var a = document.createElement("a");
  //   // document.body.appendChild(a);
  //   // a.style = "display: none";
  //   // a.href = url;
  //   // a.download = callId + ".webm";
  //   // a.click();
  //   uploadVideo(blob);
  //   window.URL.revokeObjectURL(url);
  // }

  // const screenDownload = async () => {
  //   setScreenRecorder({});
  //   let blob = new Blob(screenRecordedChunks, {
  //     type: "video/webm"
  //   });
  //   screenRecorder.stream.getTracks().forEach(track => track.stop());
  //   let buff = await blob.arrayBuffer();
  //   const decoder = new ebml.Decoder();
  //   const ebmlElms = decoder.decode(buff);
  //   const reader = new ebml.Reader();
  //   reader.drop_default_duration = false;
  //   ebmlElms.forEach((elm) => {
  //     reader.read(elm);
  //   });
  //   const duration = reader.duration;
  //   reader.stop();
  //   const refinedMetadataBuf = ebml.tools.makeMetadataSeekable(reader.metadatas, reader.duration, reader.cues);
  //   const body = buff.slice(reader.metadataSize);
  //   blob = new Blob([refinedMetadataBuf, body], {type: 'video/webm'});
  //   let url = URL.createObjectURL(blob);
  //   var a = document.createElement("a");
  //   document.body.appendChild(a);
  //   a.style = "display: none";
  //   a.href = url;
  //   a.download = callId + ".webm";
  //   a.click();
  //   // uploadVideo(blob);
  //   window.URL.revokeObjectURL(url);
  // }

  useEffect(() => {
    // if (recordedChunks.length > 0) {
    //   download();
    //   setRecorded(true);
    //   setRecording(false);
    //   endCall(true);
    // }
    // if(screenRecordedChunks.length > 0) {
    //   if(screenRecorder) screenDownload();
    // }
  })

  // const handleDataAvailable = async (event) => {
  //   if (event.data.size > 0) {
  //     let rc = [...recordedChunks];
  //     rc.push(event.data);
  //     setRecordedChunks(rc);
  //   } else {
  //     // ...
  //   }
  // }

  // const handleScreenDataAvailable = async (event) => {
  //   if (event.data.size > 0) {
  //     let rc = [...screenRecordedChunks];
  //     rc.push(event.data);
  //     setScreenRecordedChunks(rc);
  //   } else {
  //     // ...
  //   }
  // }

  useEffect(() => {
    // if (!recording && peerSrc && !recorded && type === 'agent') {
    //   setRecording(true);
      // // navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
      // // .then(stream => {
      // let options = { mimeType: 'video/webm' };
      // let mRecorder = new MediaRecorder(peerSrc, options);
      // mRecorder.ondataavailable = handleDataAvailable;
      // mRecorder.start();
      // console.log('recording started');
      // setMediaRecorder(mRecorder);

      // const rtcRec = RecordRTC(peerSrc, {type: 'video'})
      // setRTCRecorder(rtcRec);
      // rtcRec.startRecording();
      // console.log(rtcRec);



      // try {
      //   let options = { mimeType: 'video/webm' };
      //   let sRecorder = new MediaRecorder(localSrc, options);
      //   sRecorder.ondataavailable = handleScreenDataAvailable;
      //   sRecorder.start();
      //   console.log('screen recording started');
      //   setScreenRecorder(sRecorder);
      // } catch(err) {
      //   console.error("Error: " + err.message);
      // }
    
  })

  // const stopRecording = async () => {
  //   setRTCRecorder({});
  //   rtcRecorder.stopRecording(() => {
  //     uploadVideo(rtcRecorder.getBlob());
  //   });
  //   setRecorded(true);
  //   setRecording(false);
  //   // let url = URL.createObjectURL(blob);
  //   // var a = document.createElement("a");
  //   // document.body.appendChild(a);
  //   // a.style = "display: none";
  //   // a.href = url;
  //   // a.download = callId + ".webm";
  //   // a.click();
  //   // window.URL.revokeObjectURL(url);
  //   // console.log(await rtcRecorder.getBlob());
  //   // uploadVideo(rtcRecorder.blob);
  //   endCall(true);
  // }

  /**
   * Turn on/off a media device
   * @param {String} deviceType - Type of the device eg: Video, Audio
   */
  const toggleMediaDevice = (deviceType) => {
    if (deviceType === 'video') {
      setVideo(!video);
      mediaDevice.toggle('Video');
    }
    if (deviceType === 'audio') {
      setAudio(!audio);
      mediaDevice.toggle('Audio');
    }
  };

  // const takePanPhoto = async () => {
  //   if(peerSrc) {
  //     try{
  //       let video = null;
  //       if(type === 'agent') {video = peerVideo.current}
  //       else {video = localVideo.current}
  //       const canvas = document.createElement('canvas');
  //       canvas.width = video.videoWidth;
  //       canvas.height = video.videoHeight;
  //       var context = canvas.getContext('2d');
  //       context.drawImage(video, 0, 0, canvas.width, canvas.height);
  //       canvas.toBlob(blob => {
  //         if(type === 'agent') setPanPhoto(blob);
  //         if(type === 'user') sendPhotoToAgent(blob);
  //       });
  //       // const capturedImage = new ImageCapture(track);
  //       // let im = await capturedImage.grabFrame();
  //       // const canvas = document.createElement('canvas');
  //       // // resize it to the size of our ImageBitmap
  //       // canvas.width = im.width;
  //       // canvas.height = im.height;
  //       // // try to get a bitmaprenderer context
  //       // let ctx = canvas.getContext('bitmaprenderer');
  //       // if(ctx) {
  //       //   ctx.transferFromImageBitmap(im);
  //       // }
  //       // else {
  //       //   // in case someone supports createImageBitmap only
  //       //   // twice in memory...
  //       //   canvas.getContext('2d').drawImage(im,0,0);
  //       // }
  //       // // get it back as a Blob
  //       // canvas.toBlob(blob => {
  //       //   if(type === 'agent') setPanPhoto(blob);
  //       //   if(type === 'user') sendPhotoToAgent(blob);
  //       // });
  //     } catch(e) {
  //       alert(e.message);
  //     }
  //   }    
  // }

  // const faceMatch = async () => {
  //   if(peerSrc) {
  //     const video = peerVideo.current;
  //     const canvas = document.createElement('canvas');
  //     canvas.width = video.videoWidth;
  //     canvas.height = video.videoHeight;
  //     var context = canvas.getContext('2d');
  //     context.drawImage(video, 0, 0, canvas.width, canvas.height);
  //     canvas.toBlob(blob => {
  //       callFaceMatch(blob);
  //     })
  //   }
  // }

  // const callFaceMatch = async (file) => {
  //   setFaceXmlLoading(true);
  //   try {
  //     const snapshot = await database.ref('calls/'+callId).once('value');
  //     const { transaction_id, custId } = snapshot.val();
  //     let formData = new FormData();
  //     formData.append('file', file);
  //     formData.append('userId', transaction_id);
  //     let res = await axios.post(`${API_URL}/face`, formData, { headers: { custId } });
  //     if(res && res.data && res.data.face && res.data.face.data && res.data.face.data.similarity) {
  //       setFaceSimilarity(res.data.face.data.similarity);
  //       setExpanded('panel3');
  //     }
  //   } catch(e) {
  //     console.log(e);
  //   }
  //   setFaceXmlLoading(false);
  // }

  const beforeEndCall = () => {
    // if(callId) {
    //   database.ref('calls/'+callId).once('value', snapshot => {
    //     let call = snapshot.val();
    //     if(call && call.active === 1) {
    //       database.ref('calls/'+callId).update({
    //         active: 0,
    //       })
    //     }
    //   })
    // }
    // if (type === 'agent') {
    //   // if(mediaRecorder && mediaRecorder.state === 'recording') {
    //   //   mediaRecorder.stop();
    //   // }
    //   if(rtcRecorder && rtcRecorder.state === 'recording') stopRecording();
    //   // if(screenRecorder && screenRecorder.state === 'recording') screenRecorder.stop();
    // } else {
    endCall(true);
    // }
  }

  // const submitVerification = async (verified) => {
  //   if(verified) setSubmissionLoading(true);
  //   else setFailedSubmissionLoading(true);
  //   const snapshot = await database.ref('calls/'+callId).once('value');
  //   const { location, transaction_id, custId, startedOn } = snapshot.val();
  //   const formData = new FormData();
  //   formData.append('question1', question.text);
  //   formData.append('pan', nsdlData.panNumber && nsdlData.panNumber.value ? nsdlData.panNumber.value : '');
  //   formData.append('latitude', location.latitude);
  //   formData.append('longitude', location.longitude);
  //   formData.append('startTime', startedOn);
  //   formData.append('userId', transaction_id);
  //   formData.append('faceSimilarity', faceSimilarity);
  //   formData.append('answer1', questions_answered);
  //   formData.append('livenessVerfified', livenessVerified);
  //   if(verified) formData.append('status', 'completed');
  //   else formData.append('status', 'unable-to-verify');
  //   try {
  //     let response = await axios.post(`${API_URL}/update`, formData, { headers: { custId } });
  //     console.log(response);
  //     if(response && response.data && response.data.status === '200') {
  //       // if(verified) alert('Verification Completed');
  //       // else alert('Submitted Successfully');
  //       console.log(response.data);
  //       socket.emit('complete', {to: pc.friendID, urlSuccess: response.data.urlSuccess, urlFail: response.data.urlFail, status: verified ? 'success' : 'fail'});
  //       if(callId) {
  //         database.ref('calls/'+callId).once('value', snapshot => {
  //           let call = snapshot.val();
  //           if(call && call.active === 1) {
  //             database.ref('calls/'+callId).update({
  //               active: 0,
  //               completed: 1,
  //             })
  //           }
  //         })
  //       }
  //       // if(mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
  //       if(rtcRecorder && rtcRecorder.state === 'recording') stopRecording();
  //     } else {
  //       alert('Something Went Wrong. Please try again');
  //     }
  //   } catch(e) {
  //     console.log(e);
  //     alert('Verification Failed');
  //     // if(mediaRecorder && mediaRecorder.state === 'recording') mediaRecorder.stop();
  //     if(rtcRecorder && rtcRecorder.state === 'recording') stopRecording();
  //   }
  //   if(verified) setSubmissionLoading(false);
  //   else setFailedSubmissionLoading(false);
  // }

  // const changePan = e => {
  //   setPan(e.target.value);
  // }

  // const nsdlCheck = async () => {
  //   setNsdlCheckLoading(true);
  //   try {
  //     const snapshot = await database.ref('calls/'+callId).once('value');
  //     const { transaction_id, custId } = snapshot.val();
  //     let formData = new FormData();
  //     formData.append('docnumber', pan);
  //     formData.append('userId', transaction_id);
  //     let res = await axios.post(`${API_URL}/gc`, formData, {headers: {custId}});
  //     if(res && res.data && res.data.data) {
  //       let govtData = res.data.data;
  //       if(govtData.status === '1' && govtData.data && govtData.data.result){
  //         let {result} = govtData.data;
  //         setNsdlData(result);
  //         setExpanded('panel2');
  //       } else if(govtData.message) {
  //         alert(govtData.message);
  //       } else {
  //         alert('NSDL check failed due to server error.');
  //       }
  //     } else {
  //       alert('NSDL check failed due to server error.');
  //     }
  //   } catch(e) {
  //     console.log(e);
  //     alert('NSDL check couldn\'t be completed ');
  //   }
  //   setNsdlCheckLoading(false);
  // }

  // const validateSubmission = () => {
  //   if(questions_answered && locationInIndia && livenessVerified && ocrDone) return false;
  //   return true;
  // }

  // const checkDocument = async () => {
  //   setDocCheckLoading(true);
  //   let snapshot = await database.ref('calls/'+callId).once('value');
  //   let call = snapshot.val();
  //   const {custId, transaction_id} = call;
  //   const formData = new FormData();
  //   formData.append('userId', transaction_id);
  //   formData.append('image', photoFromUser);
  //   try {
  //     let response = await axios.post(`${API_URL}/ocr`, formData, { headers: { custId } });
  //     if(response && response.data && response.data.data && response.data.data.data && response.data.data.data.documentNumber) {
  //       const ocr_data = response.data.data.data;
  //       const doc_number = ocr_data.documentNumber.value;
  //       setPan(doc_number);
  //       setOcrData(ocr_data);
  //       setOcrDone(true);
  //       setExpanded('panel2');
  //     } else {
  //       alert('OCR failed. Ask user to click photo again.');
  //     }
  //   } catch (e) {
  //     alert('Something Went Wrong');
  //     console.log(e);
  //   }
  //   setDocCheckLoading(false);
  // }

  const renderOffline = ({online}) => {
    if(!online) {
      // pc.mediaDevice.stop();
      // return (
      //   <div style={
      //     {
      //       position: 'absolute',
      //       top: 0, left: 0,
      //       width: '100%',
      //       height: '100%',
      //       zIndex: 200,
      //       background: 'rgba(0,0,0,.4)',
      //       display: 'flex',
      //       flexDirection: 'column',
      //       justifyContent: 'center',
      //       alignItems: 'center',
      //     }
      //   }>
      //     <CircularProgress style={{color: '#fff', height: '2rem', width: '2rem'}} />
      //     <span style={{fontSize: '2rem', color: '#fff'}}>Reconnecting</span>
      //   </div>
      // );
    } 
    else {
      console.log('socket--------------online',socket);
      if(pc && pc.pc && pc.pc.connectionState === 'failed' && !reconnecting && !socket.connected) {
        setReconnecting(true);
        // if (_.isFunction(pc.stop)) {
        //   pc.stop();
        // }
        // pc.pc.getSenders().forEach(s => pc.pc.removeTrack(s));
        const socket_new = io(SOCKET_HOST);
        setSocket(socket_new);
        // startCall(true, friendId, callId, config);
        // console.log(pc);
        // pc.pc.createOffer({ iceRestart: true })
        // .then(desc => {
        //   pc.pc.setLocalDescription(desc)
        //   socket.emit('reconnect', { callId, sdp: desc });
        //   console.log('reconneeeeect', pc);
        // })      
      }
    }
    return null;
  }

  if(pc && pc.pc){
    pc.pc.oniceconnectionstatechange = function(evt) {
      if (pc.pc.connectionState === "failed") {
        pc.pc.createOffer({ iceRestart: true })
          .then(pc.getDescription)
      }
    }
  }

  const handleChange = (event, newValue) => {
    setTabSelected(newValue);
  };

  const a11yProps = (index) => {
    return {
      id: `simple-tab-${index}`,
      'aria-controls': `simple-tabpanel-${index}`,
    };
  }

  return (
    <>
      {/* { window.innerWidth > 480 || type !== 'agent' ? */}
      <div className={classnames(`call-window desktop ${type === 'agent' ? 'agent' : ''}`, status)}>
        <video id={enlargeLocal ? "localVideo" : "peerVideo"} onClick={type === 'user' ? () => setEnlargeLocal(false) : null} ref={peerVideo} autoPlay />
        <video id={enlargeLocal ? "peerVideo" : "localVideo"} onClick={type === 'user' ? () => setEnlargeLocal(true) : null} ref={localVideo} autoPlay muted />
        {/* {
          type === 'user' ?
          <div style={{position:'absolute', right: 0, left: 0, margin: 'auto', top: '65%', zIndex: 10, width: 'fit-content'}}>
            <span style={{ color: '#fff', background: '#000', fontSize: '1.4rem' }}>{instruction}</span>
          </div>
          : null
        } */}
        {/* <input style={{ zIndex: 100, position: 'absolute' }} type="file" name="video" accept="image/*" capture="environment" /> */}
        {/* {
          type === 'user' ?
            <> */}
              <Detector 
                render={renderOffline}
              /> 
            {/* </>
          : null
        } */}
        {
          type === 'user' && connectionState === 'new' ?
          <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0, margin: 'auto', height: 'fit-content', width: 'fit-content', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CircularProgress style={{color: '#000', height: '2rem', width: '2rem'}} />
            <span style={{fontSize: '2rem', color: '#000'}}>Calling</span>
          </div>
          : null
        }
        {
          connectionState === 'failed' || connectionState === 'disconnected' ?
          <div style={
            {
              position: 'absolute',
              top: 0, left: 0,
              width: '100%',
              height: '100%',
              zIndex: 200,
              background: 'rgba(0,0,0,.4)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }
          }>
            <CircularProgress style={{color: '#fff', height: '2rem', width: '2rem'}} />
            <span style={{fontSize: '2rem', color: '#fff'}}>Reconnecting</span>
          </div>
          :
          null
        }
        <div className={`video-control ${type === 'agent' ? 'agent-video-control' : ''}`}>
          {/* <button
            key="btnClick"
            type="button"
            className={getButtonClass('fa-camera', true, 'green')}
            onClick={takePanPhoto}
          /> */}
          {/* <button className='btn-action yellow'><FlipCameraIos style={{height: '.8em'}} onClick={changeCamera} /></button> */}
          <button
            key="btnVideo"
            type="button"
            className={getButtonClass('fa-video-camera', video)}
            onClick={() => toggleMediaDevice('video')}
          />
          <button
            key="btnAudio"
            type="button"
            className={getButtonClass('fa-microphone', audio)}
            onClick={() => toggleMediaDevice('audio')}
          />
          {/* <button
            key="btnFlip"
            type="button"
            className={getButtonClass('fa-refresh', true)}
            onClick={changeCamera}
          /> */}
          <button
            type="button"
            className="btn-action hangup fa fa-phone"
            onClick={() => { beforeEndCall(); }}
          />
        </div>
      </div>
    </>
  );
};

CallWindow.propTypes = {
  status: PropTypes.string.isRequired,
  localSrc: PropTypes.object, // eslint-disable-line
  peerSrc: PropTypes.object, // eslint-disable-line
  config: PropTypes.shape({
    audio: PropTypes.bool.isRequired,
    video: PropTypes.bool.isRequired
  }).isRequired,
  mediaDevice: PropTypes.object, // eslint-disable-line
  endCall: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  userDetails: PropTypes.object,
  question: PropTypes.object,
  callId: PropTypes.string.isRequired,
  sendPhotoToAgent: PropTypes.func.isRequired
};

export default CallWindow;
