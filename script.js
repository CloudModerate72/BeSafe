/* Probeprüfung – Prüfungslogik */
(function () {
  "use strict";

  var EXAM_DURATION_MS = 30 * 60 * 1000;
  var STORAGE_KEY = "probepruefung-state-v1";
  // Beim Aufruf dieser Adresse beendet sich der Safe Exam Browser (Schlüssel "quitURL" in der .seb-Datei).
  var QUIT_URL = new URL("beenden.html", window.location.href).href;

  /*
   * Fragentypen:
   *   mc     – Multiple Choice, "answer" ist der Index der richtigen Option
   *   number – Zahleneingabe, "answer" mit Toleranz "tolerance"
   *   text   – Texteingabe, "accept" enthält alle akzeptierten Schreibweisen
   */
  var QUESTIONS = [
    // Mathematik
    { category: "Mathematik", type: "mc", points: 1,
      text: "Wie viel sind 15 % von 240?",
      options: ["24", "32", "36", "38"], answer: 2,
      explain: "0.15 × 240 = 36" },
    { category: "Mathematik", type: "number", points: 1,
      text: "Lösen Sie die Gleichung nach x auf: 3x + 7 = 31",
      answer: 8, tolerance: 0, placeholder: "x =",
      explain: "3x = 24, also x = 8" },
    { category: "Mathematik", type: "mc", points: 1,
      text: "Was ist die Ableitung von f(x) = x³?",
      options: ["f′(x) = x²", "f′(x) = 3x²", "f′(x) = 3x", "f′(x) = x⁴ / 4"], answer: 1,
      explain: "Potenzregel: (xⁿ)′ = n · xⁿ⁻¹, also 3x²" },
    { category: "Mathematik", type: "number", points: 1,
      text: "Berechnen Sie die Fläche eines Kreises mit Radius r = 5 cm in cm². Runden Sie auf eine Dezimalstelle.",
      answer: 78.5, tolerance: 0.05, placeholder: "Fläche in cm²",
      explain: "A = π · r² = π · 25 ≈ 78.5 cm²" },
    { category: "Mathematik", type: "mc", points: 1,
      text: "Welche der folgenden Zahlen ist eine Primzahl?",
      options: ["51", "57", "59", "63"], answer: 2,
      explain: "51 = 3 · 17, 57 = 3 · 19, 63 = 7 · 9; nur 59 ist prim." },
    { category: "Mathematik", type: "number", points: 1,
      text: "Wie gross ist √144?",
      answer: 12, tolerance: 0, placeholder: "Ergebnis",
      explain: "12 · 12 = 144" },
    { category: "Mathematik", type: "mc", points: 1,
      text: "Ein rechtwinkliges Dreieck hat die Katheten a = 6 cm und b = 8 cm. Wie lang ist die Hypotenuse c?",
      options: ["9 cm", "10 cm", "12 cm", "14 cm"], answer: 1,
      explain: "Pythagoras: c = √(6² + 8²) = √100 = 10 cm" },

    // Physik
    { category: "Physik", type: "mc", points: 1,
      text: "Welches ist die SI-Einheit der Kraft?",
      options: ["Joule", "Watt", "Newton", "Pascal"], answer: 2,
      explain: "1 N = 1 kg · m/s²" },
    { category: "Physik", type: "number", points: 1,
      text: "Ein Auto fährt 150 km in 2 Stunden. Wie gross ist seine Durchschnittsgeschwindigkeit in km/h?",
      answer: 75, tolerance: 0, placeholder: "km/h",
      explain: "v = s / t = 150 km / 2 h = 75 km/h" },
    { category: "Physik", type: "mc", points: 1,
      text: "Wie gross ist die Lichtgeschwindigkeit im Vakuum ungefähr?",
      options: ["300 000 km/s", "300 000 km/h", "30 000 km/s", "3 000 000 km/s"], answer: 0,
      explain: "c ≈ 299 792 km/s ≈ 300 000 km/s" },
    { category: "Physik", type: "number", points: 1,
      text: "An einem Widerstand R = 4 Ω liegt eine Spannung U = 12 V an. Wie gross ist die Stromstärke I in Ampere?",
      answer: 3, tolerance: 0, placeholder: "I in A",
      explain: "Ohmsches Gesetz: I = U / R = 12 V / 4 Ω = 3 A" },
    { category: "Physik", type: "mc", points: 1,
      text: "Was bezeichnet man als Sublimation?",
      options: ["Übergang von flüssig zu gasförmig", "Übergang von fest zu gasförmig", "Übergang von gasförmig zu flüssig", "Übergang von fest zu flüssig"], answer: 1,
      explain: "Bei der Sublimation geht ein Stoff direkt vom festen in den gasförmigen Zustand über (z. B. Trockeneis)." },
    { category: "Physik", type: "number", points: 1,
      text: "Wie gross ist die Gewichtskraft eines Körpers mit der Masse m = 2 kg (g = 9.81 m/s²) in Newton?",
      answer: 19.62, tolerance: 0.005, placeholder: "F in N",
      explain: "F = m · g = 2 kg · 9.81 m/s² = 19.62 N" },
    { category: "Physik", type: "mc", points: 1,
      text: "Was besagt das erste Newtonsche Gesetz?",
      options: ["Kraft ist gleich Masse mal Beschleunigung", "Zu jeder Kraft gibt es eine gleich grosse Gegenkraft", "Ein Körper bleibt in Ruhe oder gleichförmiger Bewegung, solange keine Kraft auf ihn wirkt", "Energie kann weder erzeugt noch vernichtet werden"], answer: 2,
      explain: "Das erste Newtonsche Gesetz ist das Trägheitsprinzip." },

    // Allgemeinwissen
    { category: "Allgemeinwissen", type: "mc", points: 1,
      text: "Welche Stadt ist der Sitz von Bundesrat und Parlament der Schweiz (Bundesstadt)?",
      options: ["Zürich", "Genf", "Bern", "Basel"], answer: 2,
      explain: "Bern ist seit 1848 Bundesstadt." },
    { category: "Allgemeinwissen", type: "number", points: 1,
      text: "In welchem Jahr wurde gemäss Überlieferung der Bundesbrief der Alten Eidgenossenschaft geschlossen?",
      answer: 1291, tolerance: 0, placeholder: "Jahreszahl",
      explain: "Der Bundesbrief ist auf Anfang August 1291 datiert." },
    { category: "Allgemeinwissen", type: "mc", points: 1,
      text: "Wie viele Kantone hat die Schweiz?",
      options: ["23", "24", "26", "28"], answer: 2,
      explain: "Die Schweiz hat 26 Kantone." },
    { category: "Allgemeinwissen", type: "text", points: 1,
      text: "Wie lautet das chemische Symbol für Gold?",
      accept: ["au"], caseSensitive: false, solution: "Au", placeholder: "Symbol",
      explain: "Au kommt vom lateinischen «aurum»." },
    { category: "Allgemeinwissen", type: "mc", points: 1,
      text: "Wer malte die «Mona Lisa»?",
      options: ["Michelangelo", "Leonardo da Vinci", "Raffael", "Rembrandt"], answer: 1,
      explain: "Leonardo da Vinci malte die Mona Lisa Anfang des 16. Jahrhunderts." },
    { category: "Allgemeinwissen", type: "text", points: 1,
      text: "Welcher Planet ist der Sonne am nächsten?",
      accept: ["merkur", "mercury"], solution: "Merkur", placeholder: "Planet",
      explain: "Merkur umkreist die Sonne in rund 88 Tagen." }
  ];

  var CATEGORIES = ["Mathematik", "Physik", "Allgemeinwissen"];
  var MAX_POINTS = QUESTIONS.reduce(function (sum, q) { return sum + q.points; }, 0);

  var state = loadState() || freshState();
  var timerHandle = null;

  var el = function (id) { return document.getElementById(id); };

  // ---------- Speicher ----------

  function freshState() {
    return { name: "", startedAt: null, submittedAt: null, current: 0, answers: {}, flags: {}, timeUp: false };
  }

  function loadState() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveState() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Ohne Speicher läuft die Prüfung trotzdem, nur ein Neuladen setzt sie zurück.
    }
  }

  function clearState() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) { /* ignorieren */ }
  }

  // ---------- Hilfsfunktionen ----------

  function isSafeExamBrowser() {
    return /\bSEB\//.test(navigator.userAgent) || typeof window.SafeExamBrowser !== "undefined";
  }

  function parseNumber(input) {
    var cleaned = String(input).trim().replace(/[\s'’]/g, "").replace(",", ".");
    if (!/^[-+]?\d*\.?\d+$/.test(cleaned)) {
      return NaN;
    }
    return parseFloat(cleaned);
  }

  function normalizeText(input) {
    return String(input).trim().replace(/\s+/g, " ").toLowerCase();
  }

  function hasAnswer(index) {
    var value = state.answers[index];
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function isCorrect(q, value) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return false;
    }
    if (q.type === "mc") {
      return Number(value) === q.answer;
    }
    if (q.type === "number") {
      var n = parseNumber(value);
      return !isNaN(n) && Math.abs(n - q.answer) <= q.tolerance + 1e-9;
    }
    var given = q.caseSensitive ? String(value).trim() : normalizeText(value);
    return q.accept.indexOf(given) !== -1;
  }

  function solutionText(q) {
    if (q.type === "mc") {
      return String.fromCharCode(65 + q.answer) + ") " + q.options[q.answer];
    }
    if (q.type === "number") {
      return String(q.answer);
    }
    return q.solution;
  }

  function answerText(q, value) {
    if (value === undefined || value === null || String(value).trim() === "") {
      return "keine Antwort";
    }
    if (q.type === "mc") {
      return String.fromCharCode(65 + Number(value)) + ") " + q.options[Number(value)];
    }
    return String(value).trim();
  }

  function formatDuration(ms) {
    var total = Math.max(0, Math.ceil(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
  }

  // Schweizer Notenskala: Note = Punkte / Maximum × 5 + 1, gerundet auf halbe Noten
  function swissGrade(points, max) {
    var exact = (points / max) * 5 + 1;
    var rounded = Math.round(exact * 2) / 2;
    return { exact: exact, rounded: Math.min(6, Math.max(1, rounded)) };
  }

  function formatGrade(g) {
    return g.toFixed(g % 1 === 0 ? 0 : 1);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c];
    });
  }

  function showToast(message) {
    var toast = el("toast");
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.handle);
    showToast.handle = setTimeout(function () { toast.hidden = true; }, 3500);
  }

  function confirmDialog(title, text, confirmLabel, onConfirm, hideCancel) {
    el("modalTitle").textContent = title;
    el("modalText").textContent = text;
    el("modalConfirm").textContent = confirmLabel || "OK";
    el("modalCancel").hidden = !!hideCancel;
    el("modal").hidden = false;
    el("modalConfirm").focus();

    el("modalConfirm").onclick = function () {
      el("modal").hidden = true;
      if (onConfirm) { onConfirm(); }
    };
    el("modalCancel").onclick = function () {
      el("modal").hidden = true;
    };
  }

  // ---------- Bildschirme ----------

  function showScreen(name) {
    el("startScreen").hidden = name !== "start";
    el("examScreen").hidden = name !== "exam";
    el("resultScreen").hidden = name !== "result";
    window.scrollTo(0, 0);
  }

  function updateHeader() {
    var label = el("candidateLabel");
    if (state.name) {
      label.textContent = state.name;
      label.hidden = false;
    } else {
      label.hidden = true;
    }
  }

  // ---------- Timer ----------

  function remainingMs() {
    return state.startedAt + EXAM_DURATION_MS - Date.now();
  }

  function startTimer() {
    el("timer").hidden = false;
    tick();
    clearInterval(timerHandle);
    timerHandle = setInterval(tick, 250);
  }

  function tick() {
    var remaining = remainingMs();
    var timer = el("timer");
    el("timerValue").textContent = formatDuration(remaining);
    timer.classList.toggle("warn", remaining <= 5 * 60 * 1000 && remaining > 60 * 1000);
    timer.classList.toggle("critical", remaining <= 60 * 1000);

    if (!tick.warned5 && remaining <= 5 * 60 * 1000 && remaining > 60 * 1000) {
      tick.warned5 = true;
      showToast("Noch 5 Minuten verbleibend.");
    }
    if (!tick.warned1 && remaining <= 60 * 1000 && remaining > 0) {
      tick.warned1 = true;
      showToast("Noch 1 Minute verbleibend.");
    }
    if (remaining <= 0) {
      state.timeUp = true;
      submitExam();
      confirmDialog("Zeit abgelaufen", "Die Prüfungszeit von 30 Minuten ist abgelaufen. Ihre Antworten wurden automatisch abgegeben.", "Resultat ansehen", null, true);
    }
  }

  function stopTimer() {
    clearInterval(timerHandle);
    timerHandle = null;
  }

  // ---------- Prüfung ----------

  function buildNavigator() {
    var nav = el("navigator");
    nav.innerHTML = "";
    QUESTIONS.forEach(function (q, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-item";
      btn.textContent = String(i + 1);
      btn.setAttribute("aria-label", "Frage " + (i + 1));
      btn.addEventListener("click", function () { goTo(i); });
      nav.appendChild(btn);
    });
  }

  function updateNavigator() {
    var items = el("navigator").children;
    for (var i = 0; i < items.length; i++) {
      items[i].classList.toggle("answered", hasAnswer(i));
      items[i].classList.toggle("flagged", !!state.flags[i]);
      items[i].classList.toggle("current", i === state.current);
    }
    var answered = QUESTIONS.filter(function (q, i) { return hasAnswer(i); }).length;
    el("progressText").textContent = answered + " / " + QUESTIONS.length + " beantwortet";
    el("progressFill").style.width = (answered / QUESTIONS.length * 100) + "%";
    el("progressBar").setAttribute("aria-valuenow", String(answered));
  }

  function renderQuestion() {
    var i = state.current;
    var q = QUESTIONS[i];
    var badge = el("qCategory");

    badge.textContent = q.category;
    badge.className = "badge cat-" + q.category.toLowerCase();
    el("qNumber").textContent = "Frage " + (i + 1) + " von " + QUESTIONS.length;
    el("qPoints").textContent = q.points + (q.points === 1 ? " Punkt" : " Punkte");
    el("qText").textContent = q.text;

    var area = el("answerArea");
    area.innerHTML = "";

    if (q.type === "mc") {
      var list = document.createElement("div");
      list.className = "options";
      list.setAttribute("role", "radiogroup");
      q.options.forEach(function (option, j) {
        var label = document.createElement("label");
        label.className = "option" + (Number(state.answers[i]) === j && hasAnswer(i) ? " selected" : "");

        var input = document.createElement("input");
        input.type = "radio";
        input.name = "q" + i;
        input.value = String(j);
        input.checked = hasAnswer(i) && Number(state.answers[i]) === j;
        input.addEventListener("change", function () {
          state.answers[i] = j;
          saveState();
          renderQuestion();
          updateNavigator();
        });

        var key = document.createElement("span");
        key.className = "option-key";
        key.textContent = String.fromCharCode(65 + j);

        var text = document.createElement("span");
        text.textContent = option;

        label.appendChild(input);
        label.appendChild(key);
        label.appendChild(text);
        list.appendChild(label);
      });
      area.appendChild(list);
    } else {
      var wrap = document.createElement("div");
      wrap.className = "text-answer";

      var field = document.createElement("input");
      field.type = "text";
      field.id = "textAnswer";
      field.autocomplete = "off";
      field.spellcheck = false;
      field.placeholder = q.placeholder || "Ihre Antwort";
      field.value = state.answers[i] !== undefined ? state.answers[i] : "";
      field.setAttribute("aria-label", "Antwort");
      field.addEventListener("input", function () {
        state.answers[i] = field.value;
        saveState();
        updateNavigator();
      });
      field.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          if (state.current < QUESTIONS.length - 1) { goTo(state.current + 1); }
        }
      });

      var hint = document.createElement("span");
      hint.className = "hint";
      hint.textContent = q.type === "number"
        ? "Nur die Zahl eingeben, ohne Einheit. Dezimalpunkt oder -komma sind erlaubt."
        : "Gross-/Kleinschreibung spielt keine Rolle.";

      wrap.appendChild(field);
      wrap.appendChild(hint);
      area.appendChild(wrap);
      setTimeout(function () { field.focus(); }, 0);
    }

    el("prevBtn").disabled = i === 0;
    el("nextBtn").disabled = i === QUESTIONS.length - 1;
    var flagged = !!state.flags[i];
    el("flagBtn").setAttribute("aria-pressed", flagged ? "true" : "false");
    el("flagBtn").textContent = flagged ? "Markiert" : "Markieren";
  }

  function goTo(index) {
    if (index < 0 || index >= QUESTIONS.length) { return; }
    state.current = index;
    saveState();
    renderQuestion();
    updateNavigator();
  }

  function startExam() {
    state = freshState();
    state.name = el("candidateName").value.trim();
    state.startedAt = Date.now();
    saveState();
    resumeExam();
  }

  function resumeExam() {
    updateHeader();
    showScreen("exam");
    buildNavigator();
    renderQuestion();
    updateNavigator();
    startTimer();
  }

  function requestSubmit() {
    var open = [];
    var flagged = [];
    QUESTIONS.forEach(function (q, i) {
      if (!hasAnswer(i)) { open.push(i + 1); }
      if (state.flags[i]) { flagged.push(i + 1); }
    });

    var text = "Nach der Abgabe können Sie Ihre Antworten nicht mehr ändern.";
    if (open.length) {
      text += "\n\nUnbeantwortet: " + open.length + " (Frage " + open.join(", ") + ")";
    }
    if (flagged.length) {
      text += "\nMarkiert: Frage " + flagged.join(", ");
    }
    confirmDialog("Prüfung abgeben?", text, "Jetzt abgeben", submitExam);
  }

  function submitExam() {
    if (state.submittedAt) { return; }
    stopTimer();
    state.submittedAt = Math.min(Date.now(), state.startedAt + EXAM_DURATION_MS);
    saveState();
    renderResult();
  }

  // ---------- Resultat ----------

  function renderResult() {
    stopTimer();
    updateHeader();
    el("timer").hidden = true;

    var points = 0;
    var perCategory = {};
    CATEGORIES.forEach(function (c) { perCategory[c] = { points: 0, max: 0 }; });

    var list = el("reviewList");
    list.innerHTML = "";

    QUESTIONS.forEach(function (q, i) {
      var value = state.answers[i];
      var correct = isCorrect(q, value);
      var earned = correct ? q.points : 0;
      points += earned;
      perCategory[q.category].points += earned;
      perCategory[q.category].max += q.points;

      var item = document.createElement("li");
      item.className = "review-item " + (correct ? "correct" : "wrong");
      item.innerHTML =
        '<div class="review-head">' +
          '<strong>Frage ' + (i + 1) + '</strong>' +
          '<span class="badge cat-' + q.category.toLowerCase() + '">' + escapeHtml(q.category) + '</span>' +
          '<span class="review-status">' + (correct ? "richtig" : "falsch") + ' · ' + earned + '/' + q.points + '</span>' +
        '</div>' +
        '<p class="review-q">' + escapeHtml(q.text) + '</p>' +
        '<dl class="review-answers">' +
          '<dt>Ihre Antwort</dt><dd class="' + (correct ? "" : "yours-wrong") + '">' + escapeHtml(answerText(q, value)) + '</dd>' +
          '<dt>Lösung</dt><dd class="solution">' + escapeHtml(solutionText(q)) + '</dd>' +
        '</dl>' +
        (q.explain ? '<p class="review-explain">' + escapeHtml(q.explain) + '</p>' : "");
      list.appendChild(item);
    });

    var percent = points / MAX_POINTS * 100;
    var grade = swissGrade(points, MAX_POINTS);
    var passed = grade.rounded >= 4;

    el("resultKicker").textContent = state.timeUp ? "Zeit abgelaufen – automatisch abgegeben" : "Prüfung abgegeben";
    el("resultTitle").textContent = (state.name ? state.name + ": " : "") + (passed ? "Genügend" : "Ungenügend");
    el("gradeValue").textContent = formatGrade(grade.rounded);
    el("gradeExact").textContent = grade.exact.toFixed(2);
    el("pointsValue").textContent = points + " / " + MAX_POINTS;
    el("percentValue").textContent = percent.toFixed(1) + " %";
    el("timeUsed").textContent = formatDuration(state.submittedAt - state.startedAt) + " min";

    var ring = el("gradeRing");
    ring.style.setProperty("--pct", percent.toFixed(1));
    ring.classList.toggle("pass", passed);
    ring.classList.toggle("fail", !passed);

    var breakdown = el("categoryBreakdown");
    breakdown.innerHTML = "";
    CATEGORIES.forEach(function (c) {
      var d = perCategory[c];
      var pct = d.max ? d.points / d.max * 100 : 0;
      var row = document.createElement("div");
      row.className = "cat-row";
      row.innerHTML =
        '<div class="cat-name">' + escapeHtml(c) + '</div>' +
        '<div class="cat-score">' + d.points + ' / ' + d.max + ' Punkte (' + pct.toFixed(0) + ' %)</div>' +
        '<div class="bar"><span style="width:' + pct.toFixed(1) + '%"></span></div>';
      breakdown.appendChild(row);
    });

    el("quitHint").hidden = true;
    showScreen("result");
  }

  function quitExam() {
    if (isSafeExamBrowser()) {
      // Der Safe Exam Browser erkennt die quitURL und fragt nach einer Bestätigung zum Beenden.
      window.location.href = QUIT_URL;
    } else {
      var hint = el("quitHint");
      hint.textContent = "Sie verwenden einen normalen Browser. Im Safe Exam Browser wird an dieser Stelle die Prüfung beendet. Sie können dieses Fenster jetzt schliessen.";
      hint.hidden = false;
    }
  }

  function restartExam() {
    confirmDialog("Neuer Versuch?", "Ihr aktuelles Resultat wird verworfen und die Prüfung beginnt von vorne, sobald Sie auf «Prüfung starten» klicken.", "Neu beginnen", function () {
      clearState();
      state = freshState();
      tick.warned5 = tick.warned1 = false;
      updateHeader();
      el("candidateName").value = "";
      showScreen("start");
    });
  }

  // ---------- Ereignisse ----------

  el("maxPointsFact").textContent = String(MAX_POINTS);
  el("startBtn").addEventListener("click", startExam);
  el("candidateName").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { startExam(); }
  });
  el("prevBtn").addEventListener("click", function () { goTo(state.current - 1); });
  el("nextBtn").addEventListener("click", function () { goTo(state.current + 1); });
  el("flagBtn").addEventListener("click", function () {
    state.flags[state.current] = !state.flags[state.current];
    saveState();
    renderQuestion();
    updateNavigator();
  });
  el("submitBtn").addEventListener("click", requestSubmit);
  el("quitBtn").addEventListener("click", quitExam);
  el("restartBtn").addEventListener("click", restartExam);

  document.addEventListener("keydown", function (e) {
    if (!el("modal").hidden && e.key === "Escape") {
      el("modal").hidden = true;
      return;
    }
    if (el("examScreen").hidden || !el("modal").hidden) { return; }
    var typing = document.activeElement && document.activeElement.tagName === "INPUT" && document.activeElement.type === "text";
    if (typing) { return; }
    if (e.key === "ArrowRight") { goTo(state.current + 1); }
    if (e.key === "ArrowLeft") { goTo(state.current - 1); }
  });

  // ---------- Start ----------

  if (state.submittedAt) {
    renderResult();
  } else if (state.startedAt) {
    if (remainingMs() <= 0) {
      state.timeUp = true;
      submitExam();
    } else {
      resumeExam();
    }
  } else {
    showScreen("start");
  }
})();
