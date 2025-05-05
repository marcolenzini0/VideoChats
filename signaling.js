const socket = new WebSocket("ws://localhost:3000");

socket.onopen = () => console.log("✅ WebSocket connesso");
socket.onmessage = async ({ data }) => {
  const msg = JSON.parse(data);
  switch (msg.type) {
    case "offer":
      await handleOffer(msg.offer);
      break;
    case "answer":
      await handleAnswer(msg.answer);
      break;
    case "candidate":
      handleCandidate(msg.candidate);
      break;
    case "hangup":
      hangUp();
      break;
  }
};

function sendMessage(message) {
  socket.send(JSON.stringify(message));
}
