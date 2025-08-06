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
        let boardRect = null;

        function processFrame() {
          cap.read(src);
          cv.imshow("videoCanvas", src);

          // Convert to grayscale and preprocess
          cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
          cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
          cv.threshold(blurred, thresh, 180, 255, cv.THRESH_BINARY);

          // Find contours for board detection
          cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

          boardRect = null;
          let maxArea = 0;

          for (let i = 0; i < contours.size(); ++i) {
            const cnt = contours.get(i);
            const rect = cv.boundingRect(cnt);
            const area = rect.width * rect.height;
            const aspect = rect.width / rect.height;

            if (area > maxArea && aspect > 0.2 && aspect < 5) {
              maxArea = area;
              boardRect = rect;
            }
            cnt.delete();
          }

          overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

          if (boardRect) {
            // Draw board outline in blue
            overlayCtx.strokeStyle = "blue";
            overlayCtx.lineWidth = 3;
            overlayCtx.strokeRect(boardRect.x, boardRect.y, boardRect.width, boardRect.height);

            // Crop to board ROI
            const roi = gray.roi(boardRect);
            const roiBlurred = new cv.Mat();
            const roiThresh = new cv.Mat();

            cv.GaussianBlur(roi, roiBlurred, new cv.Size(5, 5), 0);
            cv.threshold(roiBlurred, roiThresh, 100, 255, cv.THRESH_BINARY_INV); // more stable threshold

            const defectContours = new cv.MatVector();
            const defectHierarchy = new cv.Mat();

            cv.findContours(
              roiThresh,
              defectContours,
              defectHierarchy,
              cv.RETR_EXTERNAL,
              cv.CHAIN_APPROX_SIMPLE
            );

            overlayCtx.strokeStyle = "red";
            overlayCtx.lineWidth = 2;

            const boardArea = boardRect.width * boardRect.height;

            for (let i = 0; i < defectContours.size(); ++i) {
              const cnt = defectContours.get(i);
              const rect = cv.boundingRect(cnt);
              const defectArea = rect.width * rect.height;

              // Filter small noise and board-sized false positives
              if (
                rect.width > 30 &&
                rect.height > 30 &&
                defectArea < 0.6 * boardArea
              ) {
                overlayCtx.strokeRect(
                  boardRect.x + rect.x,
                  boardRect.y + rect.y,
                  rect.width,
                  rect.height
                );
              }

              cnt.delete();
            }

            roi.delete();
            roiBlurred.delete();
            roiThresh.delete();
            defectContours.delete();
            defectHierarchy.delete();
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
