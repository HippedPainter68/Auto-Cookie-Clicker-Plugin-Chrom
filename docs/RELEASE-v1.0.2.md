**Fehlerbehebung für `(b.tieredAchievs || []).filter is not a function`.**

Version 1.0.2 korrigiert zusätzlich die Gebäude-Register tieredAchievs und tieredUpgrades, die Cookie Clicker als Objekte bereitstellt. Die vorige Korrektur hatte nur die globalen Register erfasst. Die Kaufplanung liest nun alle ihre Eingabesammlungen über Werte-Snapshots; die Originalregister und die Spielwerte werden dabei nicht verändert.

Die Testdaten enthalten befüllte Tier-Objekte mit Querverweisen auf globale Achievements/Upgrades und zurück auf ihre Gebäude. Geprüft werden auch Meilensteine mit Milchbonus, nahe Tier-Upgrades als Kaufpaket und stringbasierte Fortune-Einträge. Ein Quelltext-Audit dokumentiert 25 Sammlungstypen aus fünf Original-Spielskripten. Eine zusätzliche AST-Prüfung erkennt direkte Array-Operationen auf bekannten Objektregistern.

**Aktualisieren:**

1. `Auto-Cookie-Clicker-Plugin-Chrom-v1.0.2.zip` herunterladen und entpacken.
2. Die Dateien im bisherigen Erweiterungsordner ersetzen. Denselben Ordner beibehalten, um ID, Einstellungen und lokale Backups zu erhalten.
3. Unter `chrome://extensions` bei der Erweiterung **Neu laden** (Kreispfeil) anklicken.
4. Die Cookie-Clicker-Spielseite neu laden und anschließend die Automatik starten.

**32 Node-Tests, 10 Browser-Prüfungen und 5 native Chrome-Erweiterungsprüfungen bestanden.** Die native Prüfung lief mit den befüllten Tier-Objekten. Die Spielzustände bleiben synthetisch; ein kompletter Live-Spieldurchlauf und alle Endgame-Wege sind weiterhin nicht bewiesen. Keine Ressourcen-, Zeit-, Zufalls- oder Achievement-Cheats. GPL-3.0-only; CookieBot-Basis von prinzstani und Mitwirkenden.
