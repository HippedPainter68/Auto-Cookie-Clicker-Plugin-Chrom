# Auto Cookie Clicker Plugin Chrom

Eine lokale Chrome-Erweiterung für Cookie Clicker: automatischer Langzeitspieler, gemeinsame Kaufbewertung für Gebäude und Upgrades, Minispielstrategien, automatische Aufstiege und lokale Sicherungen. Basierend auf [prinzstani/CookieBot](https://github.com/prinzstani/CookieBot), mit entfernten Cheat-Routinen und eigenem Effizienzmodell.

**Ziel:** effizient auf alle legitimen Achievements hinarbeiten. Das ist keine Garantie, dass jeder Spielstand und jeder Erfolg schon vollständig automatisiert ist. „Cheated cookies taste awful“ ist ausgeschlossen. Der Bot schenkt keine Cookies, Klumpen, Drops, Zeit oder Erfolge. „Third-party“ ist ein regulärer Erfolg für die tatsächliche Mod-Registrierung.

## Installation in Chrome

1. Das Erweiterungs-ZIP aus [Releases](https://github.com/HippedPainter68/Auto-Cookie-Clicker-Plugin-Chrom/releases) herunterladen und entpacken. Alternativ dieses Repository als ZIP herunterladen und entpacken.
2. `chrome://extensions` in Chrome öffnen und oben rechts **Entwicklermodus** einschalten.
3. **Entpackte Erweiterung laden** anklicken. Beim Release-ZIP den entpackten Ordner mit `manifest.json` auswählen; beim Quellcode-ZIP den Unterordner **extension**.
4. [Cookie Clicker](https://orteil.dashnet.org/cookieclicker/) öffnen bzw. einmal neu laden. Eine eventuelle Sicherheitsprüfung der Webseite selbst abschließen.
5. Das Erweiterungssymbol anklicken und **Automatik starten** wählen. Vor dem Start wird eine bestätigte lokale Sicherung angelegt.

Kein `npm`, keine Konsole und kein Tampermonkey für die Installation nötig. Die Erweiterung erscheint auch in Chromium-Browsern mit kompatibler Manifest-V3-Unterstützung. Eine Chrome-Web-Store-Veröffentlichung ist nicht enthalten.

## Bedienung

- **Start/Pause:** stoppt bzw. startet die Spielaktionen. Menü oder Bestätigungsdialog im Spiel pausiert die laufende Steuerung vorübergehend.
- **Tempo:** 5, 10 oder bis zu 40 normale Klickversuche pro Sekunde; die Spiellimits gelten weiterhin.
- **Investitionshorizont:** automatisch nach Ziel oder 1 Stunde bis 10 Jahre. Ein vermuteter früherer Ziel-Aufstieg verkürzt ihn. Der Bot spart, wenn ein Kauf sich voraussichtlich nicht rechtzeitig bezahlt macht.
- **Automatischer Aufstieg:** kann deaktiviert werden. Aktiviert erlaubt er reguläre Aufstiege, Wiedergeburt, himmlische Käufe, permanente Slots und nötige Born-Again-Durchläufe.
- **Fortsetzen:** merkt sich Start/Pause lokal und setzt beim erneuten Laden des Spiels fort.
- **Fenster-Erfolge:** optional wird das echte Chrome-Fenster kurz verkleinert und anschließend wiederhergestellt. Für Cookie-dunker muss zuvor genug Milch vorhanden sein. Wenn ausgeschaltet, bleiben diese zwei Erfolge manuell erreichbar.
- **Backups:** vor dem ersten Start, vor Fortsetzungen, etwa alle 15 Minuten und vor Aufstiegen. Bis zu 14 lokale Sicherungen einschließlich der ersten und mehrerer Aufstiegsstände. Export über das Popup; keine Sicherungen werden hochgeladen.

Bei einem neuen Spiel wartet der Bot für True Neverclick auf natürliche goldene Cookies und kauft für Hardcore zunächst keine Upgrades. Das kann lange ruhig aussehen. Den großen Cookie in dieser Phase nicht selbst anklicken.

## Vorhandene Installation aktualisieren

Das neue Erweiterungs-ZIP herunterladen und seine Dateien in den bisherigen Erweiterungsordner kopieren und ersetzen. Anschließend unter `chrome://extensions` bei **Auto Cookie Clicker Plugin Chrom** auf **Neu laden** (Kreispfeil) klicken und die Cookie-Clicker-Spielseite neu laden. Verwende denselben Ordner, damit die Erweiterungs-ID, Einstellungen und lokalen Backups erhalten bleiben.

Version **1.0.1** behebt `game.AchievementsById.filter is not a function`: Cookie Clicker verwendet Objekte für seine Achievement- und Upgrade-Register. Die bisherigen Testdaten hatten diese als Arrays nachgebildet; die Tests verwenden nun die tatsächliche Datenform und prüfen zusätzlich die Array-Variante.

## Wie er investiert

Ein Tempel mit +20.000 CpS für 80 Millionen kostet 4.000 Sekunden zusätzlicher Produktion. Eine Bank mit +8.700 CpS für 17 Millionen kostet rund 1.954 Sekunden. Unter diesen Bedingungen gewinnt die Bank. Ein 500-Millionen-Upgrade für +2 % wird mit dem aktuellen Zusatzgewinn bewertet und ebenfalls mit Gebäuden verglichen.

Das Modell berücksichtigt bekannte Tier-Boni, Gebäudesynergien, Milch/Kätzchen, Finger-/Maus-Upgrades, Keks-Multiplikatoren, Klickrate, Bankreserve, Kaufwartezeit und nahe Tier-Freischaltungen. Es verändert zur Berechnung keine echten Spielwerte. Nicht modellierte Spezialeffekte werden im herunterladbaren JSON-Bericht sichtbar. Es handelt sich um ein nachvollziehbares heuristisches Modell; perfekte globale Optimierung und alle möglichen Endgame-Kombos werden nicht behauptet.

## Langzeitstrategie und Grenzen

Garten-Züchtungen, reguläre Zuckerklumpen, Pantheon, Grimoire, Börse, Jahreszeiten, Santa, Krumblor und Aufstiege sind integriert. [Strategien, Quellen und konkrete Abdeckung](docs/STRATEGIEN.md) erklären die Regeln und noch fehlende Optimierungen. [Projektziel](GOAL.md) und [Testbericht](docs/TESTBERICHT.md) dokumentieren den Stand.

Die Basisstrategie stammt aus CookieBot 2.052. Andere Spielversionen zeigen einen Kompatibilitätshinweis. Additive Einträge werden defensiv berücksichtigt; bei Laufzeitfehlern pausiert der Bot. Browser/Spiel müssen zum aktiven Spielen laufen. Chrome kann Hintergrund-Tabs und schlafende Rechner drosseln. Es gibt keinen künstlichen 24/7-Serverlauf und keine Zeitbeschleunigung. Ein Jahres-Erfolg braucht echte Zeit; seltene Zufalls-Erfolge können sehr lange dauern.

Sicherungen ersetzen vor Änderungen am Spiel keine eigene externe Kopie. Wiederherstellen: Bot pausieren, passende Sicherung als Text herunterladen, über die normalen Spieloptionen importieren und die Spielseite neu laden. Der Bot importiert oder rerollt niemals selbst. Ein bereits laufender Original-CookieBot muss vor der Nutzung deaktiviert werden; zwei Instanzen dieses Plugins für denselben Save werden durch einen Browser-Lock verhindert.

## Entwicklung

Node.js 22 oder neuer:

```sh
npm ci
npm run build
npm test
npx playwright install chromium
npm run test:browser
npm run package
```

Für den Browser-Test wird unter Windows standardmäßig installiertes Chrome verwendet; alternativ `COOKIEPILOT_CHROME_PATH` setzen. Unter Linux nutzt Playwright seinen installierten Browser. `test:browser` verwendet einen synthetischen Spielvertrag und ersetzt den Erweiterungs-Transport. Zusätzlich prüft `npm run test:native` mit modernem installiertem Chrome die native Installation, den echten Erweiterungs-Transport und Speicher in einem separaten Testprofil; auch hier ist das Game-Objekt synthetisch. Der manuelle Live-Abruf des echten Spiels wurde durch Cloudflare blockiert; siehe Testbericht.

`vendor/` enthält die unveränderte fixierte GPL-Quelle samt Prüfsumme. `src/strategy-overrides.js` enthält die Änderungen. `scripts/build.mjs` entfernt unzulässige Wege und erzeugt `extension/vendor/strategy.js`. Nur `extension/` wird von Chrome geladen. Build und Tests laufen ohne externe Spielcode-Downloads.

## Lizenz

GPL-3.0-only, einschließlich des bearbeiteten CookieBot-Codes. Herkunft und Änderungen: [THIRD_PARTY.md](THIRD_PARTY.md), Volltext: [LICENSE](LICENSE). Unabhängiges Projekt; Cookie Clicker und seine Grafiken gehören Orteil/DashNet. Dieses Repository enthält weder private Spielstände noch die Spieldateien.
