# Probeprüfung für den Safe Exam Browser

Eine Probeprüfung (Mathematik, Physik, Allgemeinwissen) mit 20 Fragen und 30 Minuten Zeit, die im offiziellen **Safe Exam Browser (SEB)** läuft.

**Prüfungs-URL (online):** https://cloudmoderate72.github.io/BeSafe/

## Schnellstart (Windows 11)

1. Den Safe Exam Browser installieren (aktuelle Version 3.x): https://safeexambrowser.org/download_en.html
2. Doppelklick auf **`Probepruefung.seb`**.
3. SEB startet im Vollbild und öffnet direkt die Prüfung. Auf «Prüfung starten» klicken.

Eine Internetverbindung ist nötig, sonst muss nichts eingerichtet werden. Die Prüfungsseite liegt schon auf GitHub Pages.

## Probeprüfung beenden

| Weg | Ablauf |
|---|---|
| Normal | Prüfung abgeben → Resultat ansehen → **«Probeprüfung beenden»** → SEB fragt nach einer Bestätigung und beendet sich. |
| Vorzeitig (Notausgang) | Beenden-Symbol in der SEB-Taskleiste unten rechts → Passwort **`Probe2026`** eingeben. |

Technisch: Der Knopf ruft `…/beenden.html` auf. Diese Adresse steht in der .seb-Datei als `quitURL`. Erkennt SEB sie, beendet sich der Browser (`quitURLConfirm`: mit Rückfrage).

## Dateien

| Datei | Zweck |
|---|---|
| `Probepruefung.seb` | SEB-Konfiguration für die Online-Prüfung (GitHub Pages) |
| `Probepruefung_lokal.seb` | SEB-Konfiguration für `http://localhost:8000/` (ohne Internet, siehe unten) |
| `index.html`, `style.css`, `script.js` | Prüfungswebseite |
| `beenden.html` | Ziel der quitURL (wird in SEB nie angezeigt, nur in normalen Browsern) |
| `start_lokal.bat` | Startet einen lokalen Webserver für die Offline-Variante |
| `tools/make_seb.py` | Erzeugt eine .seb-Datei für eine beliebige Prüfungs-URL |
| `tools/seb-validator/` | Prüft .seb-Dateien mit den Original-Klassen aus dem SEB-Quellcode |

## Was die .seb-Datei einstellt

Die Datei ist eine **unverschlüsselte XML-Property-List**. Genau dieses Format speichert das offizielle SEB Config Tool, wenn man ohne Passwort für «Starting an exam» speichert. Man kann sie mit einem Texteditor öffnen. Alle 49 Schlüssel stammen aus `SafeExamBrowser.Configuration/ConfigurationData/Keys.cs` des offiziellen Quellcodes ([seb-win-refactoring](https://github.com/SafeExamBrowser/seb-win-refactoring)).

- **Vollbild**: `browserViewMode = 1`, keine Symbolleiste, keine Adressleiste, kein Vor/Zurück
- **Nur die Prüfung erreichbar**: URL-Filter erlaubt nur `cloudmoderate72.github.io/BeSafe/*`, alles andere wird blockiert
- **Keine neuen Fenster/Tabs**: `newBrowserWindowByLinkPolicy = 0` (blockieren)
- **Keine Hilfsmittel**: Alt+Tab, Alt+F4, Windows-Taste, Ctrl+Esc, Druck-Taste und rechte Maustaste sind gesperrt. Ausserdem gibt es keine Rechtschreibprüfung, keine Suche, keinen Druck, keine Downloads/Uploads und keine Entwicklerwerkzeuge. Die Zwischenablage funktioniert nur innerhalb von SEB.
- **Kiosk-Modus**: SEB läuft auf einem eigenen Desktop (`createNewDesktop`)
- **Sicherheit**: Bildschirmfreigabe und virtuelle Maschinen sind nicht erlaubt (SEB-Standard)
- **Saubere Sitzung**: Cookies und Browserprofil werden beim Start und beim Ende gelöscht
- **Keine Administrationsrechte nötig**: Es wird kein Admin-Passwort gesetzt und keine Systemeinstellung dauerhaft verändert (`sebConfigPurpose = 0` = nur Prüfung starten, der Client wird nicht umkonfiguriert)

Hinweise:
- In einer **virtuellen Maschine** startet SEB mit dieser Konfiguration absichtlich nicht (`allowVirtualMachine = false`).
- Bei **Fernwartungs- oder Bildschirmaufnahme-Programmen** (TeamViewer, AnyDesk, OBS …) verlangt SEB, dass man sie vorher schliesst. Das ist die eingebaute Prozessliste von SEB.

## Offline-Variante (ohne Internet)

SEB ist für Prüfungen über `http(s)` gedacht. Deshalb läuft die Prüfung auch offline über einen kleinen lokalen Webserver und nicht als `file://`-Datei:

1. [Python](https://www.python.org/downloads/) installieren (einmalig).
2. `start_lokal.bat` doppelklicken und das schwarze Fenster offen lassen.
3. `Probepruefung_lokal.seb` doppelklicken.

## Eigene URL verwenden

Wenn Sie die Webseite woanders hosten (Schulserver, eigenes GitHub-Repo, Netlify …), erzeugen Sie eine passende .seb-Datei:

```bash
python tools/make_seb.py --url https://ihr-server.ch/probepruefung/ --out Probepruefung.seb
# optional: --quit-password "IhrPasswort"
```

Die URL muss auf `/` oder `index.html` enden. Das Skript setzt `startURL`, die `quitURL` (`…/beenden.html`) und den URL-Filter automatisch. Wer lieber mit dem offiziellen **SEB Config Tool** arbeitet (Windows: Startmenü → «SEB Config Tool»), kann die Datei dort öffnen und unter «General → Start URL» ändern. Danach die Filterregel unter «Network → Filter» und die «Quit URL» unter «Exam» anpassen.

### Eigenes GitHub-Pages-Hosting

1. Dateien in ein öffentliches GitHub-Repository hochladen.
2. *Settings → Pages → Build and deployment → Deploy from a branch* → Branch `main`, Ordner `/ (root)`.
3. Nach 1–2 Minuten ist die Seite unter `https://<benutzer>.github.io/<repo>/` erreichbar.
4. Mit `tools/make_seb.py` eine .seb-Datei für diese URL erzeugen.

In diesem Repository wird die Seite aus dem Branch `gh-pages` veröffentlicht. Nach Änderungen an der Prüfung also auch diesen Branch aktualisieren: `git push origin main:gh-pages`.

## Prüfung anpassen

Die Fragen stehen am Anfang von `script.js` im Array `QUESTIONS`. Es gibt drei Fragetypen:

```js
{ category: "Mathematik", type: "mc",     points: 1, text: "…", options: ["A", "B", "C", "D"], answer: 2, explain: "…" }
{ category: "Physik",     type: "number", points: 1, text: "…", answer: 19.62, tolerance: 0.005, explain: "…" }
{ category: "Allgemeinwissen", type: "text", points: 1, text: "…", accept: ["merkur", "mercury"], solution: "Merkur" }
```

Die Prüfungsdauer steht in `EXAM_DURATION_MS`.

**Notenberechnung (Schweiz):** Note = Punkte ÷ Maximalpunktzahl × 5 + 1, gerundet auf halbe Noten. Ab Note 4 ist die Prüfung genügend.

## Validierung – was geprüft wurde und was nicht

Geprüft:
- **Schlüssel**: Alle Schlüssel der .seb-Dateien wurden mit `Keys.cs` aus dem aktuellen SEB-Quellcode abgeglichen. Es gibt keine unbekannten Schlüssel.
- **Laden und Übernehmen**: `tools/seb-validator/validate.sh` kompiliert die Original-Klassen von SEB für Windows (`XmlParser`, `DataValidator`, `DataMapper`, `DataProcessor`, `SimplifiedRule`, `RequestFilter`) und lädt die .seb-Dateien in derselben Reihenfolge wie `ConfigurationRepository.TryLoadSettings`. Ergebnis: Parsing «Success», Validierung bestanden, alle Einstellungen wie beabsichtigt übernommen. Der URL-Filter erlaubt die Prüfungsseiten und blockiert Google, Wikipedia und ChatGPT. Die quitURL wird erkannt.
- **Erreichbarkeit**: `https://cloudmoderate72.github.io/BeSafe/` antwortet mit HTTP 200.
- **Prüfungswebseite**: In Chromium (der Engine, die SEB verwendet) wurde automatisiert getestet: Start, Antworten, Navigation, Markieren, Neuladen mit erhaltenem Zustand, Abgabe, Bewertung, Zeitablauf, Beenden über die quitURL und Darstellung auf schmalen Bildschirmen. Es traten keine JavaScript-Fehler auf.

**Nicht** geprüft: Ein Start im echten Safe Exam Browser unter Windows 11 war in der Entwicklungsumgebung (Linux) nicht möglich. Kiosk-Modus, Tastatursperren und das Beenden-Dialogfeld sind deshalb nicht in SEB selbst getestet. Validierung erneut ausführen (benötigt git und .NET SDK 8):

```bash
tools/seb-validator/validate.sh Probepruefung.seb Probepruefung_lokal.seb
```

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| Doppelklick öffnet SEB nicht | Prüfen, ob SEB installiert ist. Sonst SEB starten und die .seb-Datei über das Startfenster laden oder per Rechtsklick → «Öffnen mit» → Safe Exam Browser. |
| «Virtuelle Maschine erkannt» | Auf einem echten Windows-PC starten. |
| Seite lädt nicht | Internetverbindung prüfen, URL im normalen Browser testen. Bei der lokalen Variante muss `start_lokal.bat` laufen. |
| SEB lässt sich nicht beenden | Prüfung abgeben und «Probeprüfung beenden» wählen, oder das Beenden-Symbol in der Taskleiste mit Passwort `Probe2026` verwenden. |
