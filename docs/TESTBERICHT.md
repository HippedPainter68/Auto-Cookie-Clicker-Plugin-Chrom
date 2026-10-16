# Testbericht

Stand: 16.10.2026, Version 1.0.2.

## Fehlerbehebung 1.0.2

Ein weiterer Live-Fehlerbericht zeigte `(b.tieredAchievs || []).filter is not a function`. Die vorherige Korrektur hatte die globalen Register berücksichtigt, aber die Gebäude-Tiers in den Testdaten weiterhin falsch als Arrays nachgebildet. Der Original-Konstruktor legt sowohl tieredAchievs als auch tieredUpgrades als Objekte an. Auch diese zwei Zugriffe sind jetzt korrigiert; alle Sammlungen, die in die Kaufplanung eingehen, werden über Werte-Snapshots gelesen. Die Originaleinträge und ihre Identitäten bleiben unverändert.

Die Standard-Testdaten enthalten jetzt befüllte Tier-Objekte, die dieselben Achievement-/Upgrade-Instanzen wie die globalen Register verwenden, einschließlich des Rückverweises vom Upgrade auf sein Gebäude. Neue Fachtests prüfen den zusätzlichen Milchgewinn an einem Meilenstein, die Paketbewertung eines nahen Tier-Upgrades und einen stringbasierten Fortune-Eintrag. Auch die Unveränderlichkeitsprüfung erfasst diese zyklischen Querverweise.

Ein schreibgeschützter Quelltext-Audit erfasst 25 Sammlungstypen aus main.js und vier Minispielskripten. Der Nachweis in tests/game-collections.json enthält ausschließlich Typinformationen, Quell-URLs, Zeilen und Datei-Prüfsummen. Eine zusätzliche AST-Prüfung erkennt direkte Array-Methoden, for-of und Iterable-Spreads auf den bekannten Objektregistern. Diese Prüfung begrenzt sich auf die dokumentierten Felder.

Version 1.0.2: **32 Node-Tests, 10 Browser-Prüfungen und 5 native Erweiterungsprüfungen bestanden**. Die native Prüfung bestätigt ausdrücklich die befüllten Objektregister an Gebäuden und den laufenden Bank-vor-Tempel-Kauf. Ein vollständiger Live-Durchlauf bleibt ungeprüft.

## Fehlerbehebung 1.0.1

Ein Live-Fehlerbericht zeigte `game.AchievementsById.filter is not a function`. Der Original-Spielcode deklariert `Game.AchievementsById={}` und `Game.UpgradesById={}`. Die bisherigen synthetischen Testdaten hatten beide Register fälschlich als Arrays angelegt. Dadurch konnten die Tests den Startfehler trotz nativer Erweiterungsinstallation nicht erkennen.

Die Zugriffe in Startprüfung, Achievement-Bericht, Zielauswahl und Kaufplanung lesen jetzt die Einträge mit Object.values; die Originalregister werden dabei nicht verändert. Die Standard-Testdaten bilden nun Objekte ohne Array-Methoden und ohne length nach. Drei zusätzliche Regressionstests prüfen diese Form sowie weiterhin unterstützte Array-Register. Mit den korrigierten Testdaten wurde der Fehler zunächst reproduziert und anschließend behoben.

Version 1.0.1: **27 Node-Tests, 10 Browser-Prüfungen und 5 native Erweiterungsprüfungen bestanden**. Alle Browser-Spielzustände sind weiterhin synthetisch; die beiden Register haben jetzt die Form des Original-Spielcodes. Vollständige reale Spielzustände und ein kompletter Live-Durchlauf bleiben außerhalb der belegten Abdeckung.

## Automatisiert

- 32 Node-Tests: die beiden gewünschten Wirtschaftlichkeitsbeispiele, Upgrade-gegen-Gebäude, Kitten/Milch, Gebäudesynergien, Horizont vor Aufstieg, Bankreserve, verbotene Upgrade-Pools, Null-Einkommen, Unveränderlichkeit bei zyklischen Gebäude-/Upgrade-Referenzen, Regressionen für beide Registerformen und die oben beschriebenen Tier- und Typprüfungen.
- Strategie-Regressionen: Neverclick, natürliche Lump-Timer, Wrinkler-Eingaben ohne HP-Schreiben, bestätigtes Backup vor Aufstieg, Schutz neuer Gartenpflanzen und Börsengewinn, Ausschluss des Cheat-Achievements, Jahres-Warteziel, exakte Billion, Queenbeet-/Everdaisy-Layouts und reife Juicy-Queenbeet-Ernte.
- AST-Prüfung des ausgelieferten Engines: keine direkten Ressourcen-/Achievement-Schreibzugriffe, Belohnungsaufrufe, Timer-/RNG-Überschreibungen, Save-Importe oder künstliche Klickbeträge. Manifest-Ziele und alle referenzierten Skripte geprüft. Diese Prüfung ist eine Regression gegen bekannte Cheat-Wege, kein allgemeiner mathematischer Sicherheitsbeweis.
- 10 Chromium/Chrome-Browser-Prüfungen mit synthetischem Spielvertrag: Start/Pause, bestätigtes Backup, Neverclick, Bankkauf vor Tempel, Export, dynamischer Achievement-Bericht, Zweit-Tab-Sperre, Fortsetzen nach Neuladen und Popup-Transport. Screenshot der Oberfläche visuell geprüft.
- 5 zusätzliche native Prüfungen in Chrome 155.0.8059.80: ungepackte Manifest-V3-Erweiterung wirklich installiert, MAIN-/ISOLATED-World-Verbindung, echtes Popup mit chrome.tabs-Nachrichten, bestätigtes Backup in echtem chrome.storage.local und Kauf des Bank-vor-Tempel-Beispiels. Dafür wurde ausschließlich ein separates Testprofil mit einem synthetischen Game-Objekt benutzt.
- Für Version 1.0.0 wurde zusätzlich ein frischer Clone des öffentlichen GitHub-Repositories geprüft: npm ci, Build und die damaligen 24 Node-Tests bestanden; das erzeugte Erweiterungs-ZIP war bytegleich mit dem lokalen Paket. Die falsche Registerform wurde erst durch den oben dokumentierten Live-Fehlerbericht entdeckt.

## Ausdrückliche Grenzen

Die Tests nutzen den echten Runner und die echte Popup-Oberfläche mit einem synthetischen Game-Objekt. In `test:browser` werden Chrome-Erweiterungstransport und Speicher nachgebildet; `test:native` prüft diese zusätzlich mit einer wirklich installierten Erweiterung. Das separat heruntergeladene Playwright-Chromium ließ sich in dieser Windows-Umgebung nicht starten. Installiertes Chrome funktionierte; die native Installation im Testprofil erfolgte über die offizielle DevTools-Methode Extensions.loadUnpacked. Die normale Chrome-Sitzung des Benutzers wurde nicht verwendet.

Live-Aufrufe der beiden Spielhosts zeigten Cloudflares Sicherheitsprüfung. Es wurde kein CAPTCHA umgangen. Der aktuelle Original-Spielcode und seine Minispieldateien konnten zur Mechanikprüfung separat gelesen werden. Es gibt keinen belegten vollständigen Durchlauf des echten Spiels, keinen Langzeittest über Monate/Jahre und keine Zusage, dass jedes Achievement in jedem Start-Save automatisch erreichbar ist. Reale Fenster-Erfolge und seltene RNG-Ketten sind durch die Vertrags-Tests nicht vollständig bewiesen.
