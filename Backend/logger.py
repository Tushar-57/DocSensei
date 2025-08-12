# logger.py
import logging
import sys

class ColorFormatter(logging.Formatter):
    COLORS = {
        'INFO': '\033[94m',      # Blue
        'AI': '\033[95m',        # Magenta
        'SYSTEM': '\033[92m',    # Green
        'RESET': '\033[0m',
    }
    def format(self, record):
        color = self.COLORS.get(record.levelname, self.COLORS['RESET'])
        msg = super().format(record)
        return f"{color}{msg}{self.COLORS['RESET']}"

class CategoryFilter(logging.Filter):
    def __init__(self, category):
        super().__init__()
        self.category = category
    def filter(self, record):
        record.category = self.category
        return True

def get_logger(category: str):
    logger = logging.getLogger(category)
    if not logger.hasHandlers():
        handler = logging.StreamHandler(sys.stdout)
        formatter = ColorFormatter('[%(asctime)s] [%(levelname)s] [%(category)s] %(message)s', "%Y-%m-%d %H:%M:%S")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    logger.addFilter(CategoryFilter(category))
    return logger

# Usage:
# logger = get_logger('AI')
# logger.info('This is an info message from AI')
# logger = get_logger('SYSTEM')
# logger.info('System started')
