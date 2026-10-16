**Fehlerbehebung für `game.AchievementsById.filter is not a function`.**

Cookie Clicker stellt seine Achievement- und Upgrade-Register als Objekte bereit. Die Erweiterung erwartete an mehreren Stellen Arrays und konnte deshalb im echten Spiel nicht starten. Version 1.0.1 korrigiert Startprüfung, Fortschrittsanzeige, Zielauswahl und Upgrade-Kaufplanung. Spielwerte und Save-Format werden durch die Korrektur nicht verändert.

**Vorhandene Installation aktualisieren:**

1. `Auto-Cookie-Clicker-Plugin-Chrom-v1.0.1.zip` herunterladen und entpacken.
2. Die Dateien in den bisherigen Erweiterungsordner kopieren und ersetzen. Denselben Ordner beibehalten, damit ID, Einstellungen und Backups erhalten bleiben.
3. Unter `chrome://extensions` bei der Erweiterung den Kreispfeil **Neu laden** anklicken.
4. Die Cookie-Clicker-Spielseite neu laden und anschließend die Automatik starten.

Die Standard-Testdaten bilden jetzt die Objektregister des Original-Spielcodes nach. **27 Node-Tests, 10 Browser-Prüfungen und 5 Prüfungen der nativ installierten Chrome-Erweiterung bestanden.** Die Tests prüfen zusätzlich Array-Register. Die bisherigen Testdaten hatten beide Register fälschlich als Arrays angelegt; deshalb erkannten sie den Live-Startfehler nicht.

Weiterhin eine öffentliche Testversion: Die Spielzustände sind synthetisch; ein vollständiger Live-Spieldurchlauf und sämtliche Endgame-Wege sind nicht bewiesen. Keine Ressourcen-, Zeit-, Zufalls- oder Achievement-Cheats. GPL-3.0-only; CookieBot-Basis von prinzstani und Mitwirkenden.
