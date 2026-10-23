@echo off
rem Startet einen lokalen Webserver fuer die Probepruefung auf http://localhost:8000/
rem Danach Probepruefung_lokal.seb doppelklicken. Dieses Fenster offen lassen, bis die Pruefung beendet ist.
cd /d "%~dp0"
where py >nul 2>nul && (py -m http.server 8000 --bind 127.0.0.1 & goto :eof)
where python >nul 2>nul && (python -m http.server 8000 --bind 127.0.0.1 & goto :eof)
echo Python wurde nicht gefunden. Bitte Python von https://www.python.org/downloads/ installieren
echo oder die Online-Variante Probepruefung.seb verwenden.
pause
