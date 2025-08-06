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

      // Wait one animation frame to ensure video size is available
      requestAnimationFrame(() => {
        const width = video.videoWidth;
        const height = video.videoHeight;

        if (!width || !height) {
          alert("Video size not available.");
          return;
        }

        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = width;
        canvas.height = height;

        const cap = new cv.VideoCapture(video);
        const src = new cv.Mat(height, width, cv.CV_8UC4);

        function processFrame() {
          cap.read(src);
          cv.imshow("canvas", src);

          // Draw dummy boxes
          ctx.strokeStyle = "red";
          ctx.lineWidth = 4;
          ctx.strokeRect(100, 100, 150, 100);
          ctx.strokeRect(300, 250, 120, 80);

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
