# Strategien und Wissensgrenzen

Stand: 16.10.2026. Diese Regeln steuern eine deterministische Spielstrategie; das Plugin enthält kein Sprachmodell und lädt beim Spielen kein Wiki nach. Eine Behauptung, sämtliche Wiki-Seiten oder das mathematisch beste Spiel zu kennen, wäre falsch.

## Quellen

- Ausgangsstrategie und Einschränkungen: [CookieBot](https://github.com/prinzstani/CookieBot) und [FAQ](https://github.com/prinzstani/CookieBot/blob/master/FAQ.md), im Quellpaket auf einen Commit fixiert.
- Autoritative Mechanik: [Cookie Clicker main.js](https://orteil.dashnet.org/cookieclicker/main.js), [Garten](https://orteil.dashnet.org/cookieclicker/minigameGarden.js), [Grimoire](https://orteil.dashnet.org/cookieclicker/minigameGrimoire.js), [Pantheon](https://orteil.dashnet.org/cookieclicker/minigamePantheon.js), [Börse](https://orteil.dashnet.org/cookieclicker/minigameMarket.js). Diese Dateien wurden zur Prüfung gelesen, werden nicht mit ausgeliefert.
- Weiterführende menschliche Guides: [Gartenstrategien](https://cookieclicker.wiki.gg/wiki/Garden_Strategies), [Aufstieg](https://cookieclicker.wiki.gg/wiki/Ascension_guide), [Börse](https://cookieclicker.wiki.gg/wiki/Stock_Market), [Endgame-Kombos](https://cookieclicker.wiki.gg/wiki/Endgame_combo_guide). Einige Wiki-Seiten blockieren den direkten Abruf. Regeln werden am Spielcode geprüft. Nicht jeder Guide-Trick ist implementiert oder mit unserer Cheat-Grenze vereinbar.

## Gebäude und Upgrades

Grenzertrag statt Gesamtproduktion: Preis / zusätzliche Cookies pro Sekunde. Wartezeit auf den Kauf wird hinzugerechnet. Der Bot schätzt aktive Synergien, Großmutter-Boni, Finger-Upgrades, Tier-Upgrades, globale Keks-Multiplikatoren, Milch/Kätzchen und zusätzliche Klickerträge. Ein kleiner Zwischenkauf wird nur gewählt, wenn er sich vor dem angesparten Ziel amortisiert. Nahe Tier-Freischaltungen werden als Paket betrachtet.

Beispiel: Tempel mit +20.000 CpS für 80 Mio. hat 4.000 s Amortisation. Bank mit +8.700 CpS für 17 Mio. hat 1.954 s. Ohne weitere Effekte und Kaufwartezeit gewinnt die Bank.

500 Mio. für +2 % bringen bei 1 Mio. CpS +20.000 CpS, also 25.000 s Amortisation. Ein geplanter Aufstieg in einer Stunde würde diese Investition nicht zurückverdienen. Klickerträge können das Ergebnis ändern.

Automatischer Horizont: bei einem Backziel die geschätzte verbleibende Zeit, sonst zunächst ein Tag; falls kein Kauf rentabel ist, Anpassung bis maximal zehn Jahre. Fest eingestellte Horizonte begrenzen Käufe bewusst. Die Restzeit ist eine Schätzung ohne zukünftige Zufallskombos. Sonder-Freischaltungen haben einen getrennten kleinen Fortschritts-Etat. Unbekannte Spezialeffekte erscheinen im JSON-Bericht; es gibt keinen erfundenen exakten Ertrag. Das Modell ist eine Heuristik, keine vollständige Spielsimulation. Preis- und Drop-Effekte, manche Research-/Prestige-Boni und mehrere neue Spezial-Upgrades sind noch nicht vollständig monetär modelliert.

## Garten

Farm-Level und verfügbare Felder begrenzen jedes Layout. Die Basisstrategie züchtet fehlende Samen in bis zu vier Teilflächen parallel. Rezepte werden mit zwei Nachbararten aufgebaut; seltene Ausnahmen erhalten besondere Muster: acht Queenbeets im Ring für Juicy Queenbeet, je drei Elderwort und Tidygrass für Everdaisy. Neue unbekannte Pflanzen werden vor der Reife geschützt und dann für den Samen geerntet. Unsterbliche Pflanzen werden nicht wegen ihres Alters beseitigt.

Fertilizer ist für Wachstum, Wood Chips für seltene Mutationen vorgesehen, sobald genug Farmen und der echte Boden-Cooldown vorhanden sind. Pflanzkosten werden gegen Bankreserve und aktuelle CpS geprüft; bei Produktionsbuffs wartet der Bot mit teurem Neupflanzen. Garden-Cookies werden durch echte reife Ernten gesucht. Erst nach vollständiger Samenbank und ohne schützenswerte Ernte ist das reguläre Gartenopfer erlaubt. Es gibt kein künstliches Reifen und kein Rerollen. Die Teilflächen-Heuristik ist nicht das weltweit optimale Layout für jede Gartengröße. Hole Punching und vollständig dynamische Wachstums-Synchronisierung sind nicht implementiert.

## Vermächtnis und permanente Slots

Die Basisstrategie wählt Ziele für Grandmapocalypse, Jahreszeiten, Produktion und Spezialerfolge. Sie kauft im Aufstiegsbildschirm nur regulär verfügbare himmlische Upgrades und bezahlt deren Preis. Permanente Slots werden durch den normalen Zuweisungsdialog mit bereits besessenen Upgrades belegt. True Neverclick/Hardcore/Speed Baking erhalten nötigenfalls einen Born-Again-Durchlauf. Für Endless cycle wird nach passenden Freischaltungen frühzeitig die reguläre Aufstiegsserie versucht. Lucky-Upgrades werden nur bei tatsächlich erfüllter Prestige-Bedingung gekauft.

Vor Aufstiegen wartet der Bot auf ein bestätigtes lokales Backup, neue Gartenpflanzen, die reguläre Wrinkler-Auszahlung und laufende Zucker-Buffs. Chocolate egg wird erst nach normalem Liquidieren gekauft. Ein Lauf mit Börsengewinn für das aktuelle Gaseous-assets-Ziel wird geschützt. Keine Aufstiegsroute ist für jedes mögliche Start-Save bewiesen; sehr hohes Prestige kann numerische Grenzen des Spiels erreichen.

## Weitere Systeme

- Zuckerklumpen: natürliche Reife und Varianten abwarten; Minispiele zuerst freischalten, Garten ausbauen, Reserven und Gebäudelevel verwalten.
- Börse: Makler/Büro nur bei erfüllten Kosten, niedrige Kurse kaufen und höhere Kurse mit Trendbestätigung verkaufen. Keine Einsicht in versteckte Marktmodi, kein garantierter Handelsgewinn. Gaseous assets erfordert Gewinn in einem Aufstieg; Handel bleibt dafür im selben Lauf.
- Pantheon: reguläre Spirit-Slots und verfügbare Wechsel; Rigidel für Klumpen, andere Spirits für Produktion und Wrinkler.
- Grimoire: reguläre Magie und Zauberkosten, Force the Hand of Fate für Kombos und Four-leaf cookie. Keine Seed-Vorschau und kein erzwungenes Zauberergebnis.
- Jahreszeiten/Krumblor: echte saisonale Drops, Santa-Training, Drachenopfer, Auren und Streicheln. Kein Spawnen von Rentieren oder goldenen Cookies.
- Kleine Erfolge: normale Nachrichten-/Menü-/Namensaktionen und Geschenke; optional echte vorübergehende Fenstergrößen für die beiden Fenster-Erfolge.

## Nicht zugesicherte Abdeckung

Alle legitimen Erfolge sind das langfristige Ziel. Der Tracker zeigt alle im laufenden Spiel vorhandenen Erfolge, was nicht automatisch einen fertig getesteten Lösungsweg für jeden davon bedeutet. Unbekannte Mod-Achievements, zukünftige Versionen, perfekte Endgame-Kombos und jahrzehntelange Läufe sind nicht durch vollständige Integrationstests abgedeckt. Zufallsereignisse und die Jahresleistung lassen sich ohne Cheaten nicht terminlich garantieren. „Cheated cookies taste awful“ bleibt ausgeschlossen; „Third-party“ wird vom echten Mod-Registrierungsweg des Spiels verliehen.
