import webview
import os
import sys


class Api:
    @staticmethod
    def toggle_fullscreen():
        active_win = webview.active_window()
        if active_win:
            active_win.toggle_fullscreen()

    @staticmethod
    def close_window():
        active_win = webview.active_window()
        if active_win:
            active_win.destroy()

    # НОВАЯ ФУНКЦИЯ: Меняет размер окна из JavaScript
    @staticmethod
    def set_window_size(width, height):
        active_win = webview.active_window()
        if active_win:
            # Если мы в полноэкранном режиме, сначала выходим из него
            if active_win.fullscreen:
                active_win.toggle_fullscreen()
                import time
                time.sleep(0.1)  # Ждем 0.1 сек, чтобы Windows успела выйти из фуллскрина

            # Теперь меняем размер окна
            active_win.resize(int(width), int(height))


def get_path(filename):
    base_path = getattr(sys, '_MEIPASS', os.path.abspath("."))
    return os.path.join(base_path, filename)


if __name__ == '__main__':
    api = Api()
    main_window = webview.create_window(
        title="Divine World",
        url=get_path('index.html'),
        width=1920,
        height=1080,
        fullscreen=True,
        js_api=api
    )
    webview.start()
