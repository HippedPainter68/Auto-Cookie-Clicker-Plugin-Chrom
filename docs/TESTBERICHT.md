# Testbericht

Stand: 16.10.2026, Version 1.0.0.

## Automatisiert

- 24 Node-Tests: die beiden gewünschten Wirtschaftlichkeitsbeispiele, Upgrade-gegen-Gebäude, Kitten/Milch, Gebäudesynergien, Horizont vor Aufstieg, Bankreserve, verbotene Upgrade-Pools, Null-Einkommen und Unveränderlichkeit des echten Zustands bei der Berechnung.
- Strategie-Regressionen: Neverclick, natürliche Lump-Timer, Wrinkler-Eingaben ohne HP-Schreiben, bestätigtes Backup vor Aufstieg, Schutz neuer Gartenpflanzen und Börsengewinn, Ausschluss des Cheat-Achievements, Jahres-Warteziel, exakte Billion, Queenbeet-/Everdaisy-Layouts und reife Juicy-Queenbeet-Ernte.
- AST-Prüfung des ausgelieferten Engines: keine direkten Ressourcen-/Achievement-Schreibzugriffe, Belohnungsaufrufe, Timer-/RNG-Überschreibungen, Save-Importe oder künstliche Klickbeträge. Manifest-Ziele und alle referenzierten Skripte geprüft. Diese Prüfung ist eine Regression gegen bekannte Cheat-Wege, kein allgemeiner mathematischer Sicherheitsbeweis.
- 10 Chromium/Chrome-Browser-Prüfungen mit synthetischem Spielvertrag: Start/Pause, bestätigtes Backup, Neverclick, Bankkauf vor Tempel, Export, dynamischer Achievement-Bericht, Zweit-Tab-Sperre, Fortsetzen nach Neuladen und Popup-Transport. Screenshot der Oberfläche visuell geprüft.

## Ausdrückliche Grenzen

Der Test nutzt den echten Runner und die echte Popup-Oberfläche mit einem synthetischen Game-Objekt. Chrome-Erweiterungstransport und Speicher werden im Browser-Test nachgebildet. Eine native Installation der ungepackten Erweiterung wurde hier nicht erfolgreich durchgehend getestet. Das separat heruntergeladene Playwright-Chromium ließ sich in dieser Windows-Umgebung nicht starten; der Browser-Test lief mit installiertem Chrome. Modernes installiertes Chrome akzeptierte das automatische Laden der Erweiterung per Kommandozeile nicht.

Live-Aufrufe der beiden Spielhosts zeigten Cloudflares Sicherheitsprüfung. Es wurde kein CAPTCHA umgangen. Der aktuelle Original-Spielcode und seine Minispieldateien konnten zur Mechanikprüfung separat gelesen werden. Es gibt keinen belegten vollständigen Durchlauf des echten Spiels, keinen Langzeittest über Monate/Jahre und keine Zusage, dass jedes Achievement in jedem Start-Save automatisch erreichbar ist. Reale Fenster-Erfolge und seltene RNG-Ketten sind durch die Vertrags-Tests nicht vollständig bewiesen.
