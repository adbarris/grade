function onOpenCvReady() {
  console.log("✅ OpenCV.js loaded");
  startCameraAndDetect();
}

async function startCameraAndDetect() {
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
        video.width = width;
        video.height = height;

        videoCanvas.width = overlayCanvas.width = width;
        videoCanvas.height = overlayCanvas.height = height;

        const cap = new cv.VideoCapture(video);
        const src = new cv.Mat(height, width, cv.CV_8UC4);
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const thresh = new cv.Mat();
        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();

        const overlayCtx = overlayCanvas.getContext("2d");

        function processFrame() {
          cap.read(src);
          cv.imshow("videoCanvas", src);

          // Convert to grayscale
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

          // Blur to reduce noise
          cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

          // Adaptive threshold or Canny edge
          cv.adaptiveThreshold(
            blurred,
            thresh,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY_INV,
            11,
            2
          );

          // Find contours
          cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

          // Draw boxes
          overlayCtx.clearRect(0, 0, width, height);
          overlayCtx.strokeStyle = "red";
          overlayCtx.lineWidth = 2;

          for (let i = 0; i < contours.size(); ++i) {
            const cnt = contours.get(i);
            const rect = cv.boundingRect(cnt);

            // Filter out small blobs
            if (rect.width > 30 && rect.height > 30) {
              overlayCtx.strokeRect(rect.x, rect.y, rect.width, rect.height);
            }
            cnt.delete();
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

function waitUntilVideoReady(video) {
  return new Promise((resolve) => {
    function check() {
      if (video.videoWidth > 0 && video.videoHeight > 0) resolve();
      else requestAnimationFrame(check);
    }
    check();
  });
}
