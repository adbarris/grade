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

      requestAnimationFrame(() => {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
          alert("Video size not available.");
          return;
        }

        // Set up canvases
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
          cap.read(src);
          cv.imshow("videoCanvas", src);

          // Clear overlay canvas first
          overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

          // Draw dummy boxes
          overlayCtx.strokeStyle = "red";
          overlayCtx.lineWidth = 4;
          overlayCtx.strokeRect(100, 100, 150, 100); // Dummy knot
          overlayCtx.strokeRect(300, 250, 120, 80);  // Dummy split

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
