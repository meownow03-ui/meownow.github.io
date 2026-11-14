import webview
import os
import sys

class Api:
    @staticmethod
    def toggle_fullscreen():
        active_win = webview.active_window()
        if active_win:
            active_win.toggle_fullscreen()


def get_path(filename):
    # Чистый и безопасный путь
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