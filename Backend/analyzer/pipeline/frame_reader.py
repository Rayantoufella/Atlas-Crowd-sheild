import cv2
import numpy as np

class FrameReader:
    def __init__(self, source: str, target_fps: int = 30) -> None:
        self._cap = cv2.VideoCapture(source)
        if not self._cap.isOpened():
            raise RuntimeError(f"Failed to open video source: {source}")
        self._native_fps = self._cap.get(cv2.CAP_PROP_FPS)
        if self._native_fps <= 0:
            self._native_fps = target_fps
        self._skip_interval = max(1, round(self._native_fps / target_fps))
        self._frame_index = 0
        self.total_frames = int(self._cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.width = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps = self._native_fps

    def read(self) -> tuple[bool, np.ndarray | None, int]:
        while True:
            ret, frame = self._cap.read()
            if not ret:
                return False, None, self._frame_index
            self._frame_index += 1
            if (self._frame_index % self._skip_interval) == 0:
                return True, frame, self._frame_index

    def release(self) -> None:
        if self._cap is not None:
            self._cap.release()
            self._cap = None

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.release()
