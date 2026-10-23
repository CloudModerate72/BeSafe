#!/usr/bin/env python3
"""Erzeugt eine unverschlüsselte Safe-Exam-Browser-Konfigurationsdatei (.seb).

Format: XML-Property-List (Apple plist), genau so, wie das offizielle
"SEB Config Tool" für Windows eine Datei speichert, wenn man sie ohne Passwort
und ohne Zertifikat für den Zweck "Starting an Exam" sichert
(SebWindowsConfig/Utilities/SEBConfigFileManager.cs, EncryptSEBSettingsWithCredentials).
SEB für Windows liest dieses Format mit dem XmlParser
(SafeExamBrowser.Configuration/DataFormats/XmlParser.cs).

Alle Schlüsselnamen stammen aus SafeExamBrowser.Configuration/ConfigurationData/Keys.cs
(https://github.com/SafeExamBrowser/seb-win-refactoring).

Beispiele:
    python3 tools/make_seb.py --url https://cloudmoderate72.github.io/BeSafe/ --out Probepruefung.seb
    python3 tools/make_seb.py --url http://localhost:8000/ --out Probepruefung_lokal.seb
"""

import argparse
import hashlib
import plistlib
import sys
from urllib.parse import urljoin, urlsplit

DEFAULT_QUIT_PASSWORD = "Probe2026"


def filter_expression(start_url):
    """Erlaubt alle Seiten im Verzeichnis der Start-URL (vereinfachte SEB-Filtersyntax)."""
    parts = urlsplit(start_url)
    directory = parts.path.rsplit("/", 1)[0] + "/"
    host = parts.hostname + (":%d" % parts.port if parts.port else "")
    return host + directory + "*"


def build_settings(start_url, quit_password):
    quit_url = urljoin(start_url, "beenden.html")

    return {
        # Zweck der Datei: 0 = Prüfung starten (nicht: Client dauerhaft konfigurieren)
        "sebConfigPurpose": 0,

        # Prüfungsseite und definiertes Ende
        "startURL": start_url,
        "quitURL": quit_url,
        "quitURLConfirm": True,
        "allowQuit": True,
        "hashedQuitPassword": hashlib.sha256(quit_password.encode("utf-8")).hexdigest(),

        # Browserfenster: Vollbild, keine Symbolleiste, keine Adressleiste, keine Vor/Zurück-Navigation
        "browserViewMode": 1,
        "enableBrowserWindowToolbar": False,
        "browserWindowAllowAddressBar": False,
        "allowBrowsingBackForward": False,
        "browserWindowAllowReload": True,
        "showReloadWarning": True,
        "browserWindowShowURL": 0,
        "allowDeveloperConsole": False,

        # Keine zusätzlichen Fenster oder Tabs
        "newBrowserWindowByLinkPolicy": 0,
        "newBrowserWindowByLinkBlockForeign": True,

        # Nur die Prüfungsseite ist erreichbar
        "URLFilterEnable": True,
        "URLFilterEnableContentFilter": False,
        "URLFilterRules": [
            {
                "active": True,
                "regex": False,
                "expression": filter_expression(start_url),
                "action": 1,
            },
        ],

        # Browserfunktionen, die Hilfsmittel wären
        "allowSpellCheck": False,
        "allowFind": False,
        "allowPrint": False,
        "allowDownloads": False,
        "allowUploads": False,
        "downloadAndOpenSebConfig": False,
        "allowPDFReaderToolbar": False,
        "enableZoomPage": True,

        # Sitzung sauber beginnen und beenden
        "examSessionClearCookiesOnStart": True,
        "examSessionClearCookiesOnEnd": True,
        "removeBrowserProfile": True,
        "examSessionReconfigureAllow": False,

        # Zwischenablage nur innerhalb von SEB (0 = erlauben, 1 = blockieren, 2 = isoliert)
        "clipboardPolicy": 2,

        # Tastatur und Maus
        "enableAltTab": False,
        "enableAltF4": False,
        "enableAltEsc": False,
        "enableCtrlEsc": False,
        "enableStartMenu": False,
        "enablePrintScreen": False,
        "enableRightMouse": False,
        "enableMiddleMouse": False,

        # Kiosk-Modus: SEB läuft auf einem eigenen Desktop
        "createNewDesktop": True,
        "killExplorerShell": False,

        # Sicherheit
        "allowScreenSharing": False,
        "allowVirtualMachine": False,
        "allowApplicationLog": False,

        # SEB-Taskleiste: Uhr und Tastaturlayout, Beenden-Knopf (mit Passwort)
        "showTaskBar": True,
        "showTime": True,
        "showInputLanguage": True,
        "allowWlan": False,
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--url", required=True, help="Start-URL der Prüfung (muss auf / oder index.html enden)")
    parser.add_argument("--out", required=True, help="Ausgabedatei, z. B. Probepruefung.seb")
    parser.add_argument("--quit-password", default=DEFAULT_QUIT_PASSWORD, help="Passwort zum vorzeitigen Beenden von SEB")
    args = parser.parse_args(argv)

    parts = urlsplit(args.url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        parser.error("--url muss eine vollständige http(s)-Adresse sein")

    settings = build_settings(args.url, args.quit_password)
    data = plistlib.dumps(settings, fmt=plistlib.FMT_XML, sort_keys=True)

    with open(args.out, "wb") as f:
        f.write(data)

    print("%s geschrieben (%d Bytes)" % (args.out, len(data)))
    print("  startURL: %s" % settings["startURL"])
    print("  quitURL:  %s" % settings["quitURL"])
    print("  Filter:   %s" % settings["URLFilterRules"][0]["expression"])
    return 0


if __name__ == "__main__":
    sys.exit(main())
