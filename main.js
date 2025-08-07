const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let streamStarted = false;

async function setupCamera() {
  const constraints = {
    audio: false,
    video: {
      facingMode: 'environment',
      width: { ideal: 640 },
      height: { ideal: 480 }
    }
  };

  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  video.srcObject = stream;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      resolve();
    };
  });
}

function drawBoardOutline(x, y, width, height) {
  ctx.strokeStyle = 'blue';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}

function drawDefectBox(x, y, width, height, label) {
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  ctx.fillStyle = 'red';
  ctx.font = '12px Arial';
  ctx.fillText(label, x + 4, y + 12);
}

function drawCuttingBox(x, y, width, height) {
  ctx.strokeStyle = 'green';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}

function detectBoard(frame) {
  // Dummy board detection: center 80% of the frame
  const boardX = frame.width * 0.1;
  const boardY = frame.height * 0.1;
  const boardWidth = frame.width * 0.8;
  const boardHeight = frame.height * 0.8;

  drawBoardOutline(boardX, boardY, boardWidth, boardHeight);

  return { x: boardX, y: boardY, width: boardWidth, height: boardHeight };
}

async function sendToRoboflow(base64Image) {
  const response = await fetch("https://serverless.roboflow.com/defect-in-wood-n2tyw/1?api_key=WiZf9eCC6B7g2dJvcMF3", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: `image=${base64Image}`
  });

  const data = await response.json();
  return data.predictions || [];
}

async function processFrame() {
  if (!streamStarted) return;

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const board = detectBoard(canvas);

  // Only crop inside the board area
  const boardImageData = ctx.getImageData(board.x, board.y, board.width, board.height);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = board.width;
  tempCanvas.height = board.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(boardImageData, 0, 0);

  const base64Image = tempCanvas.toDataURL("image/jpeg").split(',')[1];

  try {
    const predictions = await sendToRoboflow(base64Image);

    predictions.forEach(pred => {
      const x = board.x + pred.x - pred.width / 2;
      const y = board.y + pred.y - pred.height / 2;
      drawDefectBox(x, y, pred.width, pred.height, pred.class);
    });

    // Dummy cutting boxes
    drawCuttingBox(board.x, board.y, 20, board.height);
    drawCuttingBox(board.x + board.width - 20, board.y, 20, board.height);

  } catch (err) {
    console.error("Error with Roboflow:", err);
  }

  requestAnimationFrame(processFrame);
}

async function init() {
  await setupCamera();

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  streamStarted = true;

  requestAnimationFrame(processFrame);
}

window.onload = init;
