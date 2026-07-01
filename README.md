# FocusFlow

A simple reading and focus tool built for a student hackathon.

Paste educational text and use bionic reading, dyslexia-friendly fonts, text-to-speech, focus mode, and a Pomodoro timer — all in the browser.

## How to run

No install needed. Open `index.html` in your browser, or use a simple local server:

```bash
# Python 3
python -m http.server 8000
```

Then visit `http://localhost:8000`

## Pages

- **index.html** — Landing page
- **workspace.html** — Main reading workspace

## Tech

- HTML, CSS, JavaScript
- Web Speech API for text-to-speech
- OpenDyslexic font (loaded from CDN)

## Features

1. Paste educational text
2. Bionic Reading mode
3. Dyslexia-friendly mode (OpenDyslexic font, font size, line spacing)
4. Text-to-Speech (Play / Pause / Stop)
5. Focus mode
6. 25-minute Pomodoro timer
