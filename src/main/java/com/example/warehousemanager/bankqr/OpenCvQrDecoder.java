package com.example.warehousemanager.bankqr;

import java.util.Optional;
import org.opencv.core.Mat;
import org.opencv.core.MatOfByte;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.objdetect.QRCodeDetector;
import org.springframework.stereotype.Component;

/**
 * Giải mã QR trong ảnh bằng OpenCV ({@link QRCodeDetector}).
 */
@Component
public class OpenCvQrDecoder {
    private static final Object INIT_LOCK = new Object();
    private static volatile boolean openCvLoaded;

    private static void ensureOpenCvLoaded() {
        if (!openCvLoaded) {
            synchronized (INIT_LOCK) {
                if (!openCvLoaded) {
                    nu.pattern.OpenCV.loadLocally();
                    openCvLoaded = true;
                }
            }
        }
    }

    /**
     * @return nội dung chuỗi của QR đầu tiên đọc được (vd. payload VietQR / URL).
     */
    public Optional<String> decodeFirstQr(byte[] imageBytes) {
        if (imageBytes == null || imageBytes.length == 0) {
            return Optional.empty();
        }
        ensureOpenCvLoaded();
        Optional<String> color = tryDecode(imageBytes, Imgcodecs.IMREAD_COLOR);
        if (color.isPresent()) {
            return color;
        }
        return tryDecode(imageBytes, Imgcodecs.IMREAD_GRAYSCALE);
    }

    private Optional<String> tryDecode(byte[] imageBytes, int readMode) {
        MatOfByte mob = new MatOfByte(imageBytes);
        Mat mat = null;
        Mat points = null;
        try {
            mat = Imgcodecs.imdecode(mob, readMode);
            if (mat == null || mat.empty()) {
                return Optional.empty();
            }
            QRCodeDetector detector = new QRCodeDetector();
            points = new Mat();
            String decoded = detector.detectAndDecode(mat, points);
            if (decoded != null) {
                String t = decoded.trim();
                if (!t.isEmpty()) {
                    return Optional.of(t);
                }
            }
        } finally {
            if (points != null) {
                points.release();
            }
            if (mat != null) {
                mat.release();
            }
            mob.release();
        }
        return Optional.empty();
    }
}
