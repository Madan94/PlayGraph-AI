from __future__ import annotations

import logging
import os


def configure_logger(name: str) -> logging.Logger:
    level = os.getenv("WORKER_LOG_LEVEL", "INFO").upper()
    if not logging.getLogger().handlers:
        logging.basicConfig(
            level=level,
            format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        )
    logger = logging.getLogger(name)
    logger.setLevel(level)
    return logger
