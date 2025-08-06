async function startCamera() {
  const constraints = {
    video: { facingMode: { exact: "environment" } },
    audio: false
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById("video");
    video.srcObject = stream;
    return new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(video);
    });
  } catch (err) {
    alert("Camera error: " + err.message);
    console.error(err);
  }
}

function onOpenCvReady() {
  console.log("✅ OpenCV.js loaded");
  startApp();
}

async function startApp() {
  const video = await startCamera();
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const cap = new cv.VideoCapture(video);
  const src = new cv.Mat(video.videoHeight, video.videoWidth, cv.CV_8UC4);

  function processFrame() {
    cap.read(src);
    cv.imshow("canvas", src);

    // Dummy defect boxes for now
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.strokeRect(100, 100, 150, 100); // example "knot"
    ctx.strokeRect(300, 250, 120, 80);  // example "crack"

    requestAnimationFrame(processFrame);
  }

  requestAnimationFrame(processFrame);
}
