function onOpenCvReady() {
  console.log("✅ OpenCV.js loaded");
  startApp();
}

async function startApp() {
  const constraints = {
    video: { facingMode: { exact: "environment" } },
    audio: false
  };

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const video = document.getElementById("video");
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();

      waitForVideoReady(video).then(({ width, height }) => {
        console.log(`🎥 Video size ready: ${width}x${height}`);

        const videoCanvas = document.getElementById("videoCanvas");
        const overlayCanvas = document.getElementById("overlayCanvas");

        videoCanvas.width = width;
        videoCanvas.height = height;
        overlayCanvas.width = width;
        overlayCanvas.height = height;

        const videoCtx = videoCanvas.getContext("2d");
        const overlayCtx = overlayCanvas.getContext("2d");

        const cap = new cv.VideoCapture(video);
        const src = new cv.Mat(height, width, cv.CV_8UC4);

        function processFrame() {
          try {
            cap.read(src);
            cv.imshow("videoCanvas", src);

            // Draw dummy boxes
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            overlayCtx.strokeStyle = "red";
            overlayCtx.lineWidth = 4;
            overlayCtx.strokeRect(100, 100, 150, 100);
            overlayCtx.strokeRect(300, 250, 120, 80);
          } catch (err) {
            console.error("Frame processing error:", err);
          }

          requestAnimationFrame(processFrame);
        }

        requestAnimationFrame(processFrame);
      });
    };
  } catch (err) {
    alert("Camera error: " + err.message);
    console.error(err);
  }
}

// ✅ Wait until video actually reports non-zero size
function waitForVideoReady(video) {
  return new Promise((resolve) => {
    function checkSize() {
      if (video.videoWidth && video.videoHeight) {
        resolve({ width: video.videoWidth, height: video.videoHeight });
      } else {
        requestAnimationFrame(checkSize);
      }
    }
    checkSize();
  });
}
