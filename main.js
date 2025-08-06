function onOpenCvReady() {
  console.log("✅ OpenCV.js loaded");
  startCameraAndProcess();
}

async function startCameraAndProcess() {
  const video = document.getElementById("video");
  const videoCanvas = document.getElementById("videoCanvas");
  const overlayCanvas = document.getElementById("overlayCanvas");

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { exact: "environment" } },
      audio: false
    });

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();
      waitUntilVideoReady(video).then(() => {
        const width = video.videoWidth;
        const height = video.videoHeight;

        videoCanvas.width = overlayCanvas.width = width;
        videoCanvas.height = overlayCanvas.height = height;

        const videoCtx = videoCanvas.getContext("2d");
        const overlayCtx = overlayCanvas.getContext("2d");
        const cap = new cv.VideoCapture(video);
        const src = new cv.Mat(height, width, cv.CV_8UC4);

        function processFrame() {
          cap.read(src);
          cv.imshow("videoCanvas", src);

          overlayCtx.clearRect(0, 0, width, height);
          overlayCtx.strokeStyle = "red";
          overlayCtx.lineWidth = 4;
          overlayCtx.strokeRect(100, 100, 150, 100); // dummy box 1
          overlayCtx.strokeRect(300, 200, 120, 80);  // dummy box 2

          requestAnimationFrame(processFrame);
        }

        requestAnimationFrame(processFrame);
      });
    };
  } catch (err) {
    alert("Camera access failed: " + err.message);
    console.error(err);
  }
}

// Wait until video actually reports size
function waitUntilVideoReady(video) {
  return new Promise((resolve) => {
    function check() {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        resolve();
      } else {
        requestAnimationFrame(check);
      }
    }
    check();
  });
}
