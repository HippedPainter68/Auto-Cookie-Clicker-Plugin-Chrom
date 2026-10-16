# Testbericht

Stand: 16.10.2026, Version 1.0.0.

## Automatisiert

- 24 Node-Tests: die beiden gewünschten Wirtschaftlichkeitsbeispiele, Upgrade-gegen-Gebäude, Kitten/Milch, Gebäudesynergien, Horizont vor Aufstieg, Bankreserve, verbotene Upgrade-Pools, Null-Einkommen und Unveränderlichkeit des echten Zustands bei der Berechnung.
- Strategie-Regressionen: Neverclick, natürliche Lump-Timer, Wrinkler-Eingaben ohne HP-Schreiben, bestätigtes Backup vor Aufstieg, Schutz neuer Gartenpflanzen und Börsengewinn, Ausschluss des Cheat-Achievements, Jahres-Warteziel, exakte Billion, Queenbeet-/Everdaisy-Layouts und reife Juicy-Queenbeet-Ernte.
- AST-Prüfung des ausgelieferten Engines: keine direkten Ressourcen-/Achievement-Schreibzugriffe, Belohnungsaufrufe, Timer-/RNG-Überschreibungen, Save-Importe oder künstliche Klickbeträge. Manifest-Ziele und alle referenzierten Skripte geprüft. Diese Prüfung ist eine Regression gegen bekannte Cheat-Wege, kein allgemeiner mathematischer Sicherheitsbeweis.
- 10 Chromium/Chrome-Browser-Prüfungen mit synthetischem Spielvertrag: Start/Pause, bestätigtes Backup, Neverclick, Bankkauf vor Tempel, Export, dynamischer Achievement-Bericht, Zweit-Tab-Sperre, Fortsetzen nach Neuladen und Popup-Transport. Screenshot der Oberfläche visuell geprüft.
- 5 zusätzliche native Prüfungen in Chrome 155.0.8059.80: ungepackte Manifest-V3-Erweiterung wirklich installiert, MAIN-/ISOLATED-World-Verbindung, echtes Popup mit chrome.tabs-Nachrichten, bestätigtes Backup in echtem chrome.storage.local und Kauf des Bank-vor-Tempel-Beispiels. Dafür wurde ausschließlich ein separates Testprofil mit einem synthetischen Game-Objekt benutzt.
- Frischer Clone des öffentlichen GitHub-Repositories: npm ci, Build und alle 24 Node-Tests bestanden; das erzeugte Erweiterungs-ZIP war bytegleich mit dem lokalen Paket.

## Ausdrückliche Grenzen

Die Tests nutzen den echten Runner und die echte Popup-Oberfläche mit einem synthetischen Game-Objekt. In `test:browser` werden Chrome-Erweiterungstransport und Speicher nachgebildet; `test:native` prüft diese zusätzlich mit einer wirklich installierten Erweiterung. Das separat heruntergeladene Playwright-Chromium ließ sich in dieser Windows-Umgebung nicht starten. Installiertes Chrome funktionierte; die native Installation im Testprofil erfolgte über die offizielle DevTools-Methode Extensions.loadUnpacked. Die normale Chrome-Sitzung des Benutzers wurde nicht verwendet.

Live-Aufrufe der beiden Spielhosts zeigten Cloudflares Sicherheitsprüfung. Es wurde kein CAPTCHA umgangen. Der aktuelle Original-Spielcode und seine Minispieldateien konnten zur Mechanikprüfung separat gelesen werden. Es gibt keinen belegten vollständigen Durchlauf des echten Spiels, keinen Langzeittest über Monate/Jahre und keine Zusage, dass jedes Achievement in jedem Start-Save automatisch erreichbar ist. Reale Fenster-Erfolge und seltene RNG-Ketten sind durch die Vertrags-Tests nicht vollständig bewiesen.
