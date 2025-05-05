let localStream, remoteStream;
let peerConnection;
const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const startButton = document.getElementById("startButton");
const hangupButton = document.getElementById("hangupButton");
const toggleCameraButton = document.getElementById("toggleCameraButton");

let cameraEnabled = true;
toggleCameraButton.disabled = true;

startButton.onclick = startCall;
hangupButton.onclick = hangUp;
toggleCameraButton.onclick = () => {
  if (!localStream) return;
  cameraEnabled = !cameraEnabled;
  localStream.getVideoTracks().forEach(track => {
    track.enabled = cameraEnabled;
  });
  toggleCameraButton.textContent = cameraEnabled ? "Camera Off" : "Camera On";
};

async function startCall() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
  toggleCameraButton.disabled = false;

  peerConnection = new RTCPeerConnection(config);
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = ({ streams: [stream] }) => {
    remoteVideo.srcObject = stream;
  };

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) sendMessage({ type: "candidate", candidate });
  };

  peerConnection.onconnectionstatechange = () => {
    if (peerConnection.connectionState === "disconnected") hangUp();
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  sendMessage({ type: "offer", offer });
}

async function handleOffer(offer) {
  peerConnection = new RTCPeerConnection(config);
  remoteStream = new MediaStream();
  remoteVideo.srcObject = remoteStream;

  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
  toggleCameraButton.disabled = false;

  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

  peerConnection.ontrack = ({ streams: [stream] }) => {
    remoteVideo.srcObject = stream;
  };

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate) sendMessage({ type: "candidate", candidate });
  };

  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  sendMessage({ type: "answer", answer });
}

async function handleAnswer(answer) {
  await peerConnection.setRemoteDescription(answer);
}

function handleCandidate(candidate) {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
}

function hangUp() {
  if (peerConnection) peerConnection.close();
  peerConnection = null;
  remoteVideo.srcObject = null;
  localVideo.srcObject = null;
  toggleCameraButton.disabled = true;
  toggleCameraButton.textContent = "Camera Off";
  cameraEnabled = true;
  sendMessage({ type: "hangup" });
}
