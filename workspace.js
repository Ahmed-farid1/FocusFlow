// ===== DOM Elements =====
const textInput = document.getElementById("textInput");
const applyTextBtn = document.getElementById("applyText");
const readingOutput = document.getElementById("readingOutput");

const bionicToggle = document.getElementById("bionicToggle");
const dyslexiaToggle = document.getElementById("dyslexiaToggle");
const focusToggle = document.getElementById("focusToggle");

const fontDecrease = document.getElementById("fontDecrease");
const fontIncrease = document.getElementById("fontIncrease");
const fontSizeLabel = document.getElementById("fontSizeLabel");
const lineDecrease = document.getElementById("lineDecrease");
const lineIncrease = document.getElementById("lineIncrease");
const lineSpacingLabel = document.getElementById("lineSpacingLabel");

const ttsPlay = document.getElementById("ttsPlay");
const ttsPause = document.getElementById("ttsPause");
const ttsStop = document.getElementById("ttsStop");
const ttsStatus = document.getElementById("ttsStatus");

const timerDisplay = document.getElementById("timerDisplay");
const timerStart = document.getElementById("timerStart");
const timerPause = document.getElementById("timerPause");
const timerReset = document.getElementById("timerReset");
const languageSelect = document.getElementById("languageSelect");

// ===== State =====
let rawText = "";
let fontSize = 20;
let lineHeight = 1.9;

// Dyslexia mode spacing limits (matches CSS goals)
const MIN_LINE_HEIGHT = 1.8;
const MAX_LINE_HEIGHT = 2.0;
const LINE_HEIGHT_STEP = 0.1;

// Pomodoro: 25 minutes in seconds
const POMODORO_SECONDS = 25 * 60;
let timerSecondsLeft = POMODORO_SECONDS;
let timerInterval = null;
let timerRunning = false;

// Text-to-speech
let speechSynth = window.speechSynthesis;
let currentUtterance = null;

// ===== Bionic Reading =====
// Bold roughly the first half of each word
function makeBionicText(text) {
  const words = text.split(/(\s+)/);

  return words
    .map(function (part) {
      // Keep spaces and newlines as-is
      if (/^\s+$/.test(part)) {
        return part;
      }

      const word = part;
      const boldLength = Math.ceil(word.length / 2);

      const boldPart = word.slice(0, boldLength);
      const normalPart = word.slice(boldLength);

      return (
        '<span class="bionic-bold">' +
        escapeHtml(boldPart) +
        "</span>" +
        '<span class="bionic-normal">' +
        escapeHtml(normalPart) +
        "</span>"
      );
    })
    .join("");
}

// Escape HTML so pasted text is safe to display
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Split text into paragraphs for comfortable long-form reading
function formatPlainText(text) {
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs
    .map(function (paragraph) {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        return "";
      }
      const withBreaks = escapeHtml(trimmed).replace(/\n/g, "<br>");
      return '<p class="reading-paragraph">' + withBreaks + "</p>";
    })
    .join("");
}

// Bionic text wrapped in paragraphs
function formatBionicText(text) {
  const paragraphs = text.split(/\n\s*\n/);

  return paragraphs
    .map(function (paragraph) {
      const trimmed = paragraph.trim();
      if (!trimmed) {
        return "";
      }
      const lines = trimmed.split("\n");
      const bionicLines = lines.map(function (line) {
        return makeBionicText(line);
      });
      return (
        '<p class="reading-paragraph">' + bionicLines.join("<br>") + "</p>"
      );
    })
    .join("");
}

// ===== Update Reading View =====
function updateReadingView() {
  if (!rawText.trim()) {
    readingOutput.innerHTML =
      '<p class="placeholder-text">Your formatted text will appear here.</p>';
    return;
  }

  if (bionicToggle.checked) {
    readingOutput.innerHTML = formatBionicText(rawText);
  } else {
    readingOutput.innerHTML = formatPlainText(rawText);
  }

  applyReadingStyles();
}

// Apply font size, line spacing, and dyslexia mode to the reading area
function applyReadingStyles() {
  readingOutput.style.fontSize = fontSize + "px";
  document.documentElement.style.setProperty(
    "--reading-font-size",
    fontSize + "px",
  );
  fontSizeLabel.textContent = fontSize + "px";

  document.documentElement.style.setProperty(
    "--reading-line-height",
    lineHeight,
  );
  lineSpacingLabel.textContent = lineHeight.toFixed(1);

  if (dyslexiaToggle.checked) {
    readingOutput.classList.add("dyslexia-mode");
    document.body.classList.add("dyslexia-active");
  } else {
    readingOutput.classList.remove("dyslexia-mode");
    document.body.classList.remove("dyslexia-active");
  }
}

function applyDyslexiaMode() {
  applyReadingStyles();
}

function applyFocusMode() {
  if (focusToggle.checked) {
    document.body.classList.add("focus-mode");
  } else {
    document.body.classList.remove("focus-mode");
  }
}

// ===== Text Input =====
applyTextBtn.addEventListener("click", function () {
  rawText = textInput.value;
  updateReadingView();
});

// Also update when toggles change (if we already have text)
bionicToggle.addEventListener("change", updateReadingView);
dyslexiaToggle.addEventListener("change", function () {
  applyDyslexiaMode();
});
focusToggle.addEventListener("change", applyFocusMode);

// ===== Font Size Controls =====
fontDecrease.addEventListener("click", function () {
  const minSize = dyslexiaToggle.checked ? 16 : 14;
  if (fontSize > minSize) {
    fontSize -= 2;
    applyReadingStyles();
  }
});

fontIncrease.addEventListener("click", function () {
  const maxSize = dyslexiaToggle.checked ? 34 : 32;
  if (fontSize < maxSize) {
    fontSize += 2;
    applyReadingStyles();
  }
});

// ===== Line Spacing Controls =====
lineDecrease.addEventListener("click", function () {
  if (lineHeight > MIN_LINE_HEIGHT) {
    lineHeight = Math.round((lineHeight - LINE_HEIGHT_STEP) * 10) / 10;
    applyReadingStyles();
  }
});

lineIncrease.addEventListener("click", function () {
  if (lineHeight < MAX_LINE_HEIGHT) {
    lineHeight = Math.round((lineHeight + LINE_HEIGHT_STEP) * 10) / 10;
    applyReadingStyles();
  }
});

// ===== Text-to-Speech =====
function getTextForSpeech() {
  // Use raw text, or what's in the input if nothing applied yet
  if (rawText.trim()) {
    return rawText;
  }
  return textInput.value.trim();
}

ttsPlay.addEventListener("click", function () {
  const text = getTextForSpeech();

  if (!text) {
    ttsStatus.textContent = "No text to read";
    return;
  }

  // If paused, resume
  if (speechSynth.paused && currentUtterance) {
    speechSynth.resume();
    ttsStatus.textContent = "Playing...";
    return;
  }

  // Stop any previous speech and start fresh
  speechSynth.cancel();

  currentUtterance = new SpeechSynthesisUtterance(text);
  currentUtterance.rate = 0.95;
  if (languageSelect && languageSelect.value === "ar") {
    currentUtterance.lang = "ar-SA";
  } else {
    currentUtterance.lang = "en-US";
  }

  currentUtterance.onstart = function () {
    ttsStatus.textContent = "Playing...";
  };

  currentUtterance.onend = function () {
    ttsStatus.textContent = "Finished";
  };

  currentUtterance.onerror = function () {
    ttsStatus.textContent = "Error — try again";
  };

  speechSynth.speak(currentUtterance);
});

ttsPause.addEventListener("click", function () {
  if (speechSynth.speaking && !speechSynth.paused) {
    speechSynth.pause();
    ttsStatus.textContent = "Paused";
  }
});

ttsStop.addEventListener("click", function () {
  speechSynth.cancel();
  currentUtterance = null;
  ttsStatus.textContent = "Stopped";
});

// ===== Pomodoro Timer =====
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const minsStr = mins < 10 ? "0" + mins : mins;
  const secsStr = secs < 10 ? "0" + secs : secs;
  return minsStr + ":" + secsStr;
}

function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timerSecondsLeft);
}

function startTimer() {
  if (timerRunning) return;

  timerRunning = true;
  timerInterval = setInterval(function () {
    if (timerSecondsLeft > 0) {
      timerSecondsLeft--;
      updateTimerDisplay();
    } else {
      // Timer finished
      pauseTimer();
      timerDisplay.textContent = "Done!";
      // Simple alert for hackathon demo
      alert("Focus session complete! Take a short break.");
      timerSecondsLeft = POMODORO_SECONDS;
      updateTimerDisplay();
    }
  }, 1000);
}

function pauseTimer() {
  timerRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
}

function resetTimer() {
  pauseTimer();
  timerSecondsLeft = POMODORO_SECONDS;
  updateTimerDisplay();
}

timerStart.addEventListener("click", startTimer);
timerPause.addEventListener("click", pauseTimer);
timerReset.addEventListener("click", resetTimer);

// Set initial display
updateTimerDisplay();
applyReadingStyles();
