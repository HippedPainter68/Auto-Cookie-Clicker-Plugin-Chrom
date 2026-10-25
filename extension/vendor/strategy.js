/* CookiePilot Legit. GPL-3.0-only. Derived from prinzstani/CookieBot 971c05403ac1b4c985c8af2d569aba8a762f79ba.
 * See LICENSE.txt and THIRD_PARTY.md. Built locally; no remote code. */
(function(root) {
root.createCookiePilotStrategy = function(Game, hooks) {
// cookie bot: auto-play-through cookie clicker
// see also https://github.com/prinzstani/CookieBot

var AutoPlay;
if (!AutoPlay) AutoPlay = {};
AutoPlay.version = "2.052";
AutoPlay.gameVersion = "2.052";

//align for new version of cookie clicker - try to collect automatically
AutoPlay.wantedAchievements = [82, 89, 108, // elder calm, 100 antimatter, halloween
    225, 227, 229, 279, 280, 372, 373, 374, 375, 390, 391, 429, 451, 452, 453, 470, 471, 472, // bake xx cookies
    534, 535, 536, 578, 579, 586, 587, 592, 593, // bake xx cookies
    585, 575, 397]; // max cps, max buildings, ascend right
AutoPlay.kittens = [31,32,54,108,187,320,321,322,425,442,462,494,613,766, 865];
AutoPlay.cursors = [0,1,2,3,4,5,6,43,82,109,188,189,660,764,873];
AutoPlay.maxBuildings = [826,827,828,829,830,831,832,833,834,835,836,837,838,839,858];
AutoPlay.butterBiscuits = [334,335,336,337,400,477,478,479,497,659,699,767,862];
AutoPlay.expensive = [38,39,40,41,42,55,56,80,81,88,89,90,104,105,106,107,
  120,121,122,123,150,151,256,257,258,259,260,261,262,263,
  338,339,340,341,342,343,350,351,352,403,404,405,406,407,
  444,445,446,447,448,453,454,455,456,457,458,464,465,466,467,468,469,
  498,499,500,501,535,536,538,565,566,567,568,569,570,571,572,573,574,
  575,576,577,578,579,580,581,582,583,584,585,586,587,588,
  607,608,609,615,616,617,652,653,654,655,656,657,658,
  678,679,680,681,682,721,722,723,724,
  807,808,809,810,811,812,813,814,815,816,
  820,821,822,823,867,868,869,870,871,872]; // most expensive cookies

//might need to align if bigger changes in cookie clicker
AutoPlay.prioUpgrades = [363, 323, // legacy, dragon
  411, 412, 413, // lucky upgrades,
  264, 265, 266, 267, 268, 520, 181, // permanent slots, season switcher,
  282, 283, 284, 291, 393, 394]; // better golden cookies, kittens, synergies
AutoPlay.valentineUpgrades = range(169,174).concat([645]);
AutoPlay.christmasUpgrades = [168];  // just wait for dominion
AutoPlay.easterUpgrades = range(210,229);
AutoPlay.halloweenUpgrades = range(134,140);
AutoPlay.allSeasonUpgrades =
  AutoPlay.valentineUpgrades.concat(AutoPlay.christmasUpgrades).
  concat(AutoPlay.easterUpgrades).concat(AutoPlay.halloweenUpgrades);
AutoPlay.level1Order = [2,6,7,5]; // unlocking order for minigames: garden, pantheon, grimoire, stock market
AutoPlay.level10Order = [2,0]; // finishing order: garden, stock market
AutoPlay.lumpRelatedAchievements = range(307,320).concat([336,427,447,525,396,268,271]);
AutoPlay.lumpHarvestAchievements = range(266,272).concat([396]);
// 27k golden cookies, shiny wrinkler, one year legacy
AutoPlay.lateAchievements = [262,491,367].concat(AutoPlay.lumpRelatedAchievements);

// cookie bot starting here
AutoPlay.robotName = "Automated ";
AutoPlay.delay = 0;
AutoPlay.night = false;
AutoPlay.finished = false;
AutoPlay.deadline = 0;
AutoPlay.canUseLumps = false;
AutoPlay.savingsGoal = 0;
AutoPlay.savingsStart = Game.startDate;  // time since start of saving
AutoPlay.buy10 = false;
AutoPlay.hyperActive=false;



AutoPlay.runRightCount=0;



//===================== Night Mode ==========================




//===================== Handle Cookies and Golden Cookies =====================









//
//======================== Handle Savings Calculation =========================
AutoPlay.handleSavings = function() {
  if (Game.ascensionMode==1) { // do not save in reborn mode
    AutoPlay.savingsGoal = 0;
    return;
  }
  if (AutoPlay.Config.SavingStrategy == 0) {  // None
    AutoPlay.savingsGoal = 0;
    return;
  }
  if (AutoPlay.Config.SavingStrategy == 2) {  // LUCKY
    AutoPlay.savingsGoal = Game.unbuffedCps * 60 * 100;
    AutoPlay.addActivity('Saving to lucky (' +
      Beautify(AutoPlay.savingsGoal) + ' cookies)');
    return;
  }
  if (AutoPlay.Config.SavingStrategy == 3) {  // LUCKY FRENZY
    AutoPlay.savingsGoal = Game.unbuffedCps * 60 * 100 * 7;
    AutoPlay.addActivity('Saving to lucky frenzy (' +
      Beautify(AutoPlay.savingsGoal) + ' cookies)');
    return;
  }
  // Auto: Save nothing for first 30 minutes, then linearly ramp up savings
  // to equal target.  Target is lucky until upgrade 'get lucky'
  // is bought, then it's lucky frenzy
  const startTime = 30 * 60 * 1000;  // wait before starting to save
  const delayTime = 5 * 60 * 1000;  // wait before starting to save
  const targetTime = 400 * 60 * 1000;  // after start, time to target amount
  let elapsedTime = AutoPlay.now-AutoPlay.savingsStart - startTime;
  let scaling = Math.min(elapsedTime / targetTime, 1);  //fraction of time to target
  if (elapsedTime < 0) {
    AutoPlay.savingsGoal = 0;
    AutoPlay.addActivity('Not saving for first ' + (startTime / 60 / 1000) +
          '+ minutes!');
    return;
  }
  if (Game.UpgradesById[52].bought && Game.UpgradesById[53].bought) {
    AutoPlay.savingsGoal = Game.unbuffedCps * 60 * 100;
  }
  else {
    AutoPlay.savingsGoal = 0;
    AutoPlay.addActivity('Not saving until golden cookie upgrades are purchased.');
    return;
  }
  if (Game.UpgradesById[86].bought)  // get lucky
    AutoPlay.savingsGoal *= 7;
  // scale goal between 0 and 1 based on elapsed time
  if (elapsedTime < targetTime) {
    AutoPlay.savingsGoal *= scaling;
    AutoPlay.addActivity('Saving to ' + Beautify(AutoPlay.savingsGoal) +
      ' cookies (' + (scaling * 100).toFixed(1) + '%)');
  }
  else {
    AutoPlay.addActivity('Saving to ' + Beautify(AutoPlay.savingsGoal) +
      ' cookies');
  }
  if (AutoPlay.savingsGoal > Game.Objects["Cursor"].getPrice()) { // saving is too expensive
    AutoPlay.savingsStart += delayTime; // delay saving
  }
  let fractionSaved = Game.cookies / AutoPlay.savingsGoal;
  // if fallen behind savings plan, reset to current fraction
  // this happens if you stop the bot for a while or buy something with
  // a big payback
  if (fractionSaved < 0.8) {
    AutoPlay.savingsStart = AutoPlay.now - startTime -
      targetTime * fractionSaved / scaling;  // fraction towards goal
  }
}

AutoPlay.buyBuilding = function(building, checkAmount=1, buyAmount=1) {
  if (building.getSumPrice(checkAmount) < Game.cookies - AutoPlay.savingsGoal) {
    building.buy(buyAmount);
    AutoPlay.hyperActive=true; // might buy more soon
    return true;
  }
  return false;
}

AutoPlay.buyUpgrade = function(upgrade, bypass=true) {
  if (upgrade.getPrice() < Game.cookies - AutoPlay.savingsGoal) {
    upgrade.buy(bypass);
    AutoPlay.hyperActive=true;  // might buy more soon
  }
}

//======================= CookieMonster Strategy ============================


//===================== Handle Upgrades ==========================
AutoPlay.handleUpgrades = function() {
  if (!Game.Achievements["Hardcore"].won && Game.UpgradesOwned==0) return;
    for (var me in Game.UpgradesById) {
        var e = Game.UpgradesById[me];
        if (e.unlocked && !e.bought && !AutoPlay.avoidbuy(e))
            AutoPlay.buyUpgrade(e, true);  // checks price, bypass = true
    };
  if (AutoPlay.canUseLumps && Game.Upgrades["Sugar frenzy"].unlocked &&
      !Game.Upgrades["Sugar frenzy"].bought &&
      (AutoPlay.now-Game.startDate) > 3*24*60*60*1000)
    Game.Upgrades["Sugar frenzy"].buy();
}

AutoPlay.avoidbuy = function(up) { //normally we do not buy 227, 71, ...
  switch(up.id) {
    case 71: case 73: return Game.Achievements["Elder nap"].won &&
      Game.Achievements["Grandmapocalypse"].won &&
      Game.Achievements["Elder slumber"].won &&
      Game.Achievements["Elder calm"].won; // brainsweep
    case 74: return Game.Achievements["Elder nap"].won &&
      Game.Achievements["Elder slumber"].won &&
      Game.Upgrades["Elder Covenant"].unlocked; // elder pledge
    case 84: return Game.Upgrades["Elder Pledge"].bought ||
      Game.Achievements["Elder calm"].won; // elder covenant
    case 227: return true; // choco egg
    case 563: return AutoPlay.nextAchievement!=432 ||
      Game.Achievements["Thick-skinned"].won; //shimmering veil
    default: return up.pool=="toggle";
  }
}

//===================== Handle Buildings ==========================
AutoPlay.handleBuildings = function() {
  var buyAmount = 100, checkAmount = 1;
  if (Game.buyMode==-1) Game.storeBulkButton(0);
  if ((AutoPlay.now-Game.startDate) > 10*60*1000) {
    buyAmount = 1; // buy single after 10 minutes
    var maxBuilding = Game.ObjectsById[Game.ObjectsById.length-1];
    if (maxBuilding.getSumPrice(100) < Game.cookies - AutoPlay.savingsGoal)
      buyAmount = 100;
    else if (maxBuilding.getSumPrice(10) < Game.cookies - AutoPlay.savingsGoal)
      buyAmount = 10;
  }
  if (Game.resets && Game.ascensionMode!=1 &&
      Game.isMinigameReady(Game.Objects["Temple"]) &&
      Game.Objects["Temple"].minigame.slot[0]==10 && // Rigidel is in slot 0
      Game.BuildingsOwned%10==0 && (AutoPlay.now-Game.startDate) > 2*60*1000)
    buyAmount = checkAmount = 10;
  var cpc = 0; // relative strength of cookie production
  for (var i = Game.ObjectsById.length-1; i>=0; i--) {
    var me = Game.ObjectsById[i];
    if (me.locked) continue;
    var mycpc = me.storedCps / me.price;
    if (mycpc>cpc) cpc = mycpc;
  }
  for (var i = Game.ObjectsById.length-1; i>=0; i--) {
    var me = Game.ObjectsById[i];
    if (me.locked) continue;
    if (me.storedCps/me.price > cpc/2 || me.amount % 50 >= 40) {
      //this checks price, sets deadline
      if (AutoPlay.buyBuilding(me, checkAmount, buyAmount)) return;
    }
  }
  if (Game.resets && Game.ascensionMode!=1 &&
      Game.isMinigameReady(Game.Objects["Temple"]) &&
      Game.Objects["Temple"].minigame.slot[0]==10 &&
      Game.BuildingsOwned%10!=0) { // Rigidel is in slot 0, buy the cheapest
    var minIdx=0, minPrice=Game.ObjectsById[minIdx].price;
    for (var i = Game.ObjectsById.length-1; i>=0; i--)
      if (Game.ObjectsById[i].price < minPrice) {
        minPrice = Game.ObjectsById[i].price;
        minIdx = i;
      }
    AutoPlay.buyBuilding(Game.ObjectsById[minIdx]);
  }
}

//===================== Handle Seasons ==========================




AutoPlay.allUnlocked = function(l) {
  return l.every(function (u) { return Game.UpgradesById[u].unlocked; });
}

AutoPlay.seasonFinished = function(s) {
  if (s=='') return true;
  switch (s) {
    case "valentines": return AutoPlay.allUnlocked(AutoPlay.valentineUpgrades);
    case "christmas":
      if (AutoPlay.allUnlocked(AutoPlay.allSeasonUpgrades)) return false;
      else return AutoPlay.allUnlocked(AutoPlay.christmasUpgrades);
    case "easter": return (Game.Achievements["Hide & seek champion"].won &&
                           AutoPlay.allUnlocked(AutoPlay.easterUpgrades));
    case "halloween": return AutoPlay.allUnlocked(AutoPlay.halloweenUpgrades);
    default: return true;
  }
}

//===================== Handle Sugarlumps ==========================
AutoPlay.minLumpsOK = false;






AutoPlay.harvestLump = function() {
  Game.clickLump();
  AutoPlay.useLump();
}

AutoPlay.useLump = function() { // recursive call to handle many sugar lumps
  AutoPlay.canUseLumps = false;
  if (!Game.lumps) return;
  for (var i in AutoPlay.level1Order) {
    var me = Game.ObjectsById[AutoPlay.level1Order[i]];
    if (!me.level && Game.lumps) { me.levelUp(); AutoPlay.useLump(); return; }
  }
  var me = Game.Objects["Farm"]; // bring Garden to level 9
  if (me.level<9) {
    if (me.level<Game.lumps) { me.levelUp(); AutoPlay.useLump(); }
    return;
  }
  AutoPlay.minLumpsOK = true;
  let lumpLimit = AutoPlay.endPhase()?0:100; // keep 100 lumps before the end game
  var me = Game.Objects["Cursor"]; // need 12 cursors for stock market
  if (me.level<12) {
    if (me.level+lumpLimit<Game.lumps) { me.levelUp(); AutoPlay.useLump(); }
    return;
  }
  for (var i = Game.ObjectsById.length-1; i>=0; i--) {
    var me = Game.ObjectsById[i];
    if (me.level<10) {
      if (me.level+lumpLimit<Game.lumps) {
        me.levelUp(); AutoPlay.useLump(); return;
      }
    }
  }
  AutoPlay.canUseLumps = true;
  var me = Game.Objects["Cursor"]; // 20 cursors for luminous gloves
  if (me.level<20) {
    if (me.level+100<Game.lumps) {
      me.levelUp(); AutoPlay.useLump(); return;
    } else {
      AutoPlay.canUseLumps = false;
    }
  }
}

AutoPlay.handleMinigames = function() {
  if (Game.ascensionMode==1) return; //no mini games in born again
  AutoPlay.handlePantheon();
  AutoPlay.handleGarden();
  AutoPlay.handleStockMarket();
}

AutoPlay.handleSpeedMinigames = function() {
  AutoPlay.handleGrimoires();
}

// wizard towers: grimoires ===========================
AutoPlay.handleGrimoires = function() {
  if (Game.isMinigameReady(Game.Objects["Wizard tower"])) {
    var g = Game.Objects["Wizard tower"].minigame;
    var t = Game.Objects["Wizard tower"];
    if (!Game.Achievements['Four-leaf cookie'].won && t.amount>500 &&
        Game.Upgrades["Distilled essence of redoubled luck"].bought) {
      // try to get four golden cookies - wait to get two at once
      var sp = g.spells["hand of fate"]; // get one more golden cookie
      if (Game.shimmerTypes['golden'].n>1 && g.magic>=g.getSpellCost(sp)) {
        g.castSpell(sp);
      }
      if (Game.shimmerTypes['golden'].n >= 3 && g.magic > 30 && t.amount>30) {
        t.sell(t.amount-g.magic); // need to wait a while for update of grimoire
      }
      return; // save magic for when we get two golden cookies
    }
    var sp = g.spells["hand of fate"]; // try to get a sugar lump in backfiring
    if (Game.shimmerTypes['golden'].n && g.magic>=g.getSpellCost(sp) &&
        g.magic/g.magicM >= 0.95) {
      g.castSpell(sp);
    }
    if (AutoPlay.cpsMult>100) {
      sp = g.spells["hand of fate"]; // try to get another golden cookie
      if (g.magic>=g.getSpellCost(sp)) {
        g.castSpell(sp); return;
      }
      sp = g.spells["conjure baked goods"]; // normally not worth it
      if (g.magic>=g.getSpellCost(sp)) {
        g.castSpell(sp); return;
      }
      if (AutoPlay.canUseLumps && Game.lumps>100) { g.lumpRefill.click(); }
    }
  }
}

// temples: pantheon =============================
AutoPlay.handlePantheon = function() {
  if (Game.isMinigameReady(Game.Objects["Temple"])) {
    var age = AutoPlay.now-Game.lumpT;
    if (AutoPlay.poppingWrinklers)
        AutoPlay.assignSpirit(0,"scorn",0);
    else if (Game.lumpRipeAge-age < 61*60*1000 && !AutoPlay.cheatLumps)
      AutoPlay.assignSpirit(0,"order",0);
    else if (AutoPlay.preNightMode() && Game.lumpOverripeAge-age < 9*60*60000 &&
        (new Date).getMinutes()==59 && !AutoPlay.cheatLumps)
      AutoPlay.assignSpirit(0,"order",0);
    else AutoPlay.assignSpirit(0,"mother",0);
    AutoPlay.assignSpirit(1,"decadence",0);
    AutoPlay.assignSpirit(2,"labor",0);
  }
}



AutoPlay.assignSpirit = function(slot, god, force) {
  var g=Game.Objects["Temple"].minigame;
  if (g.swaps+force<3) return;
  if (g.slot[slot]==g.gods[god].id) return;
  g.slotHovered = slot; g.dragging = g.gods[god]; g.dropGod();
}

AutoPlay.removeSpirit = function(slot, god) {
  var g=Game.Objects["Temple"].minigame;
  if (g.slot[slot]!=g.gods[god].id) return;
  g.slotHovered = -1; g.dragging = g.gods[god]; g.dropGod();
}

// farms: garden ================================
AutoPlay.handleGarden = function() {
  if (Game.isMinigameReady(Game.Objects["Farm"])) {
    var g = Game.Objects["Farm"].minigame;
    AutoPlay.harvesting(g);
    AutoPlay.planting(g);
    if (AutoPlay.gardenSacrificeReady(g)) {
        // get "Seedless to nay" achievement to improve future plant/upgrade growth
        AutoPlay.plantCookies = false;
        g.askConvert(); Game.ConfirmPrompt();
        AutoPlay.plantList=[0,0,0,0];
        return;
    }
    if (!AutoPlay.canUseLumps && AutoPlay.gardenReady(g) && !AutoPlay.finished &&
        !AutoPlay.harvestPlant && !AutoPlay.lumpRelatedAchievements.every(
          function(a) { return Game.AchievementsById[a].won; })) {
      AutoPlay.plantCookies = false;
      //convert garden in order to get more sugar lumps
      g.askConvert(); Game.ConfirmPrompt();
      AutoPlay.plantList=[0,0,0,0];
    }
  }
}



AutoPlay.gardenUpgrades = range(470,476);

AutoPlay.gardenSacrificeReady = function(g) {
  AutoPlay.wantGardenSacrifice = false;
  if (!Game.AchievementsById[382].won && g.plantsUnlockedN==g.plantsN) {
    // we'd like to get the achievement; check if we can
    if (!AutoPlay.harvestPlant) {
      return true;
    }
    AutoPlay.wantGardenSacrifice = true;
    AutoPlay.addActivity('Waiting for harvest before getting Seedless to Nay.');
  }
  return false;
}

AutoPlay.gardenReady = function(g) { // have all plants and all cookies
  return (Game.Objects["Farm"].level>8) &&
    (g.plantsUnlockedN==g.plantsN) &&
    AutoPlay.allUnlocked(AutoPlay.gardenUpgrades);
}

AutoPlay.plantDependencies = [
['dummy','dummy','dummy'], // just to fill index 0
['queenbeetLump','queenbeet','queenbeet'], // need to know its index
['everdaisy','elderwort','tidygrass'], // need to know its index
// queenbeet is most important
['bakeberry','bakerWheat','bakerWheat'], //level 1
['chocoroot','bakerWheat','brownMold'], //level 1
['queenbeet','chocoroot','bakeberry'], //level 2
// longest path
['thumbcorn','bakerWheat','bakerWheat'], //level 1
['cronerice','bakerWheat','thumbcorn'], //level 2
['gildmillet','thumbcorn','cronerice'], //level 3
['clover','bakerWheat','gildmillet'], //level 4
['shimmerlily','gildmillet','clover'], //level 5
['elderwort','cronerice','shimmerlily'], //level 6
//rest is given according to ripening times
['drowsyfern','chocoroot','keenmoss'], //level 7
['duketater','queenbeet','queenbeet'], //level 3
['tidygrass','bakerWheat','whiteChocoroot'], //level 3
['nursetulip','whiskerbloom','whiskerbloom'], //level 7
['doughshroom','crumbspore','crumbspore'], //level 1
['wrinklegill','crumbspore','brownMold'], //level 1
['shriekbulb','wrinklegill','elderwort'], //level 7
['ichorpuff','crumbspore','elderwort'], //level 7
['whiskerbloom','whiteChocoroot','shimmerlily'], //level 6
['chimerose','whiskerbloom','shimmerlily'], //level 7
['keenmoss','brownMold','greenRot'], //level 6
['wardlichen','cronerice','whiteMildew'], //level 3
['glovemorel','thumbcorn','crumbspore'], //level 2
['whiteChocoroot','chocoroot','whiteMildew'], //level 2
['whiteMildew','brownMold','brownMold'], //level 1
['goldenClover','bakerWheat','gildmillet'], //level 4
['greenRot','clover','whiteMildew'], //level 5
['cheapcap','crumbspore','shimmerlily'], //level 6
['foolBolete','greenRot','doughshroom'] //level 6
];

if (!AutoPlay.plantList) AutoPlay.plantList = [0,0,0,0];
AutoPlay.plantPending = false; // Plant we want that is not mature yet
AutoPlay.harvestPlant = false; // Plant that drops things when harvesting
AutoPlay.plantsMissing = true; // Still unlocked plants?

AutoPlay.sectorText = function(sector) {
  if (Game.Objects["Farm"].level>4)
    return (sector<2?'bottom':'top')+(sector%2?' left':' right');
  else if (Game.Objects["Farm"].level==4) return (sector%2?'left':'right');
  else return 'middle';
}

AutoPlay.havePlant = function(game,plant) {
  if (game.plants[plant].unlocked) return true;
  var plantID=game.plants[plant].id+1;
  for (var x = 0;x<6;x++) for (var y = 0;y<6;y++) {
    if ((game.getTile(x,y))[0]==plantID) return true;
  }
  return false;
}

AutoPlay.findPlants = function(game,idx) {
  if (AutoPlay.wantAscend) return false; // do not plant before ascend
  var couldPlant = 0;
  if (AutoPlay.plantList[idx]!=0) {// already used
    var oldPlant = AutoPlay.plantDependencies[AutoPlay.plantList[idx]][0];
    AutoPlay.addActivity("Trying to get plant " + game.plants[oldPlant].name +
      " on sector " + AutoPlay.sectorText(idx) + '.');
    AutoPlay.plantCookies = false;
    if (AutoPlay.havePlant(game,oldPlant)) AutoPlay.plantList[idx]=0;
    else return true;
  }
  // try to plant expensive plants first (if possible) as they take longest time.
  var chkx = (idx%2)?0:5; var chky = (idx>1)?0:5;
  if (game.isTileUnlocked(chkx,chky)) { // only plant if the spot is big enough
    if (!AutoPlay.havePlant(game,'everdaisy') &&
        game.plants['elderwort'].unlocked && game.plants['tidygrass'].unlocked) {
      if (AutoPlay.plantList.includes(2)) couldPlant = 2;
      else { AutoPlay.plantList[idx] = 2; return true; }
    }
    if (!AutoPlay.havePlant(game,'queenbeetLump') &&
        game.plants['queenbeet'].unlocked) {
      if (AutoPlay.plantList.includes(1)) couldPlant = 1;
      else { AutoPlay.plantList[idx] = 1; return true; }
    }
  }
  for (var i = 3; i<AutoPlay.plantDependencies.length; i++) { // plant normal plants
    var plant = AutoPlay.plantDependencies[i][0];
    if (!AutoPlay.havePlant(game,plant) &&
        game.plants[AutoPlay.plantDependencies[i][1]].unlocked &&
        game.plants[AutoPlay.plantDependencies[i][2]].unlocked) { // want it
      if (AutoPlay.plantList.includes(i)) {
        if (!couldPlant) couldPlant = i; // already planted - remember it
      } else { AutoPlay.plantList[idx] = i; return true; }
    }
  }
  if (!couldPlant) return false;
  AutoPlay.plantList[idx] = couldPlant;
  return true;
}

AutoPlay.planting = function(game) {
  if (!game.plants["meddleweed"].unlocked) {  // wait for meddleweed
    AutoPlay.plantList=[0,0,0,0];
    AutoPlay.addActivity("Waiting for meddleweed.");
    AutoPlay.switchSoil(game,0,'fertilizer');
    return;
  }
  if (!game.plants["crumbspore"].unlocked || !game.plants["brownMold"].unlocked) {
    AutoPlay.addActivity("Trying to get crumbspore and brown mold."); // use meddleweed
    for (var x = 0; x<6; x++) for (var y = 0; y<6; y++)
      if (game.isTileUnlocked(x,y)) AutoPlay.plantSeed(game,"meddleweed",x,y);
    return;
  }
  AutoPlay.plantsMissing = true;
  if (!AutoPlay.findPlants(game,0)) {
    AutoPlay.plantList=[0,0,0,0];
    for (var i = 0; i<4; i++) AutoPlay.plantSector(game,i,'','','dummy');
    return;
  }
  /* Kikicat123's Editorializing:
   * This function is a mess and could do with a refactor. That being said:
   * The current strategy for the plants uses Fertilizer for maturing plants (because of the reduced tick length)
   * and Wood Chips for Mutation, because of the increased chance.
   * However, We may not have Wood Chips, because you need >= 300 farms.
   * In that case, you want to still use fertilizer as it is still the second best for mutation, instead of dirt.
   * But, if we don't have Fertilizer, we need to fallback on dirt.
   */
  var soil = "dirt";
  if (AutoPlay.plantPending && game.parent.bought >= game.soils["fertilizer"].req) soil = "fertilizer"; // if we are waiting on a plant to mature, and we have enough farms, use Fertilizer
  else if (game.parent.bought >= game.soils["woodchips"].req) soil = "woodchips";                       // else, if we have enough farms, and we aren't waiting on a plant to mature, use Wood Chips
  else if (game.parent.bought >= game.soils["fertilizer"].req) soil = "fertilizer";                     // else, if we have enough farms for fertilizer but *not* for Wood Chips, fallback
  // else, dirt fallback (already assigned)
  AutoPlay.switchSoil(game,0,soil);
  if (Game.Objects["Farm"].level<4) {
    var targets = [[AutoPlay.plantDependencies[AutoPlay.plantList[0]][1],3,2],
      [AutoPlay.plantDependencies[AutoPlay.plantList[0]][2],3,3]];
    if(game.isTileUnlocked(3,4))
      targets = targets.concat([[AutoPlay.plantDependencies[AutoPlay.plantList[0]][1],3,4]]);
    AutoPlay.plantSeeds(game, targets);
    return;
  }
  AutoPlay.findPlants(game,1);
  if (Game.Objects["Farm"].level==4) { // now we are at level 4
    if(AutoPlay.plantList[1]==0) { AutoPlay.info("ERROR 42?"); return; }
    AutoPlay.plantSeeds(game, [
      [AutoPlay.plantDependencies[AutoPlay.plantList[0]][1],4,2],
      [AutoPlay.plantDependencies[AutoPlay.plantList[0]][2],4,3],
      [AutoPlay.plantDependencies[AutoPlay.plantList[0]][1],4,4]
    ]);
    AutoPlay.plantSeeds(game, [
      [AutoPlay.plantDependencies[AutoPlay.plantList[1]][1],1,2],
      [AutoPlay.plantDependencies[AutoPlay.plantList[1]][2],1,3],
      [AutoPlay.plantDependencies[AutoPlay.plantList[1]][1],1,4]
    ]);
    return;
  }
  AutoPlay.findPlants(game,2); AutoPlay.findPlants(game,3); // plant on four areas
  for (var sector = 0; sector<4; sector++) {
    var dep=AutoPlay.plantDependencies[AutoPlay.plantList[sector]];
    AutoPlay.plantSector(game,sector, dep[1], dep[2], dep[0]);
  }
}

AutoPlay.plantSector = function(game,sector,plant1,plant2,plant0) {
  var X = (sector%2)?0:3, Y = (sector>1)?0:3;
  if (plant0=="dummy") {
    var thePlant=AutoPlay.seedCalendar(game,sector);
    for (var x = X; x<X+3; x++) for (var y = Y; y<Y+3; y++)
      AutoPlay.plantSeed(game,thePlant,x,y);
    return;
  }
  if (plant0=="queenbeetLump") {
    for (var y = Y; y<Y+3; y++) {
      AutoPlay.plantSeed(game,plant1,X,y);
      AutoPlay.plantSeed(game,plant2,X+2,y);
    }
    AutoPlay.plantSeed(game,plant1,X+1,Y);
    AutoPlay.plantSeed(game,plant2,X+1,Y+2);
    return;
  }
  if (plant0=="everdaisy") {
    for (var y = Y; y < Y+3; y++) {
      AutoPlay.plantSeed(game,plant1,X,y);
      AutoPlay.plantSeed(game,plant2,X+2,y);
    }
    return;
  }
  AutoPlay.plantSeeds(game,[
    [plant1,X+1,Y],
    [plant2,X+1,Y+1],
    [plant1,X+1,Y+2]
  ]);
}

AutoPlay.plantCookies = false;
AutoPlay.wantGardenSacrifice = false;

AutoPlay.plantSeed = function(game,seed,whereX,whereY) {
  if (AutoPlay.cpsMult > 1+10*(false+(0>1))) {
    AutoPlay.addActivity("Do not buy plants now - it is too expensive.");
    return; // do not plant when it is expensive
  }
  if (!game.isTileUnlocked(whereX,whereY)) return; // do not plant on locked tiles
  var oldPlant = (game.getTile(whereX,whereY))[0];
  if (oldPlant!=0) { // slot is already planted, try to get rid of it
    if (game.plantsById[oldPlant-1].key!=seed)
      AutoPlay.cleanSeed(game,whereX,whereY);
    return;
  }
  if (!game.canPlant(game.plants[seed])) return;
  if (game.plants[seed].cost * 60 * Game.cookiesPs > Game.cookies - AutoPlay.savingsGoal)
    return;
  game.useTool(game.plants[seed].id,whereX,whereY);
}

AutoPlay.plantSeeds = function(game, targets) {
  // plant target locations.  Will only plant if can afford all targets.
  // targets is an array of arrays with seed, x, y positions
  if (AutoPlay.cpsMult > 1+10*(false+(0>1))) {
    AutoPlay.addActivity("Do not buy plants now - it is too expensive.");
    return; // do not plant when it is expensive
  }
  // calculate costs
  let cost = 0;
  let toPlant = []; // array of targets to plant
  // if something is in the way, reorder
  var keepSeed=0;
  for (var target of targets){
    var seed = target[0],
      whereX = target[1],
      whereY = target[2];
    if (keepSeed) {
      var swap=seed;
      seed=keepSeed;
      keepSeed=swap;
    }
    // check if valid position and can plant
    if (!game.isTileUnlocked(whereX, whereY)){
      continue;
    }
    if (!game.canPlant(game.plants[seed]))
      continue;
    // check if position is already occupied by target
	  // should be empty if canPlant is true
    var oldPlant = (game.getTile(whereX,whereY))[0];
    if (oldPlant!=0) { // slot is already planted
      // get rid of it if it isn't the target
      if (game.plantsById[oldPlant-1].key!=seed){
        AutoPlay.cleanSeed(game,whereX,whereY);
        keepSeed=seed;
        continue;  //jump over filled slot
      }
    } else { // here we know that nothing is in the spot
      cost += game.plants[seed].cost
      toPlant = toPlant.concat([[seed,whereX,whereY]])
    }
  }
  // cost is cost in minutes of current CPS
  cost *= 60 * Game.cookiesPs;
  if (cost > Game.cookies - AutoPlay.savingsGoal) {
    return;
  }
  for (var target of toPlant){
    var seed = target[0],
      whereX = target[1],
      whereY = target[2];
    game.useTool(game.plants[seed].id, whereX, whereY);
  }
}

AutoPlay.seedCalendar = function(game,sector) {
  if (AutoPlay.wantAscend || AutoPlay.wantGardenSacrifice) return 'bakerWheat'; // plant cheap before ascend
  if (sector==0) AutoPlay.plantsMissing = false;
  var doPrint =
    (sector==0) || (sector!=3 && Game.Objects["Farm"].level==sector+6);
  if (!Game.Upgrades["Ichor syrup"].unlocked &&
      game.plants["ichorpuff"].unlocked) {
    AutoPlay.switchSoil(game,sector,'fertilizer');
    if (doPrint) AutoPlay.addActivity("Trying to get Ichor syrup.");
    AutoPlay.plantCookies = true;
    return "ichorpuff";
  }
  if (!Game.Upgrades["Green yeast digestives"].unlocked &&
      game.plants["greenRot"].unlocked) {
    AutoPlay.switchSoil(game,sector,'fertilizer');
    if (doPrint) AutoPlay.addActivity("Trying to get Green yeast digestives.");
    AutoPlay.plantCookies = true;
    return "greenRot";
  }
  if (!Game.Upgrades["Duketater cookies"].unlocked &&
      game.plants["duketater"].unlocked) {
    AutoPlay.switchSoil(game,sector,'fertilizer');
    if (doPrint) AutoPlay.addActivity("Trying to get Duketater cookies.");
    AutoPlay.plantCookies = true;
    return "duketater";
  }
  if (!Game.Upgrades["Elderwort biscuits"].unlocked &&
      game.plants["elderwort"].unlocked) {
    AutoPlay.switchSoil(game,sector,'fertilizer');
    if (doPrint) AutoPlay.addActivity("Trying to get Elderwort cookies.");
    AutoPlay.plantCookies = true;
    return "elderwort";
  }
  if (!Game.Upgrades["Bakeberry cookies"].unlocked &&
      game.plants["bakeberry"].unlocked) {
    AutoPlay.switchSoil(game,sector,'fertilizer');
    if (doPrint) AutoPlay.addActivity("Trying to get Bakeberry cookies.");
    AutoPlay.plantCookies = true;
    return "bakeberry";
  }
  if (!Game.Upgrades["Wheat slims"].unlocked &&
      game.plants["bakerWheat"].unlocked) {
    AutoPlay.switchSoil(game,sector,'fertilizer');
    if (doPrint) AutoPlay.addActivity("Trying to get Wheat slims.");
    AutoPlay.plantCookies = true;
    return "bakerWheat";
  }
  if (!Game.Upgrades["Fern tea"].unlocked &&
      game.plants["drowsyfern"].unlocked) {
    AutoPlay.switchSoil(game,sector,'fertilizer');
    if (doPrint) AutoPlay.addActivity("Trying to get Fern tea.");
    AutoPlay.plantCookies = true;
    return "drowsyfern";
  }
  AutoPlay.plantCookies = false;
  AutoPlay.switchSoil(game,sector,(AutoPlay.plantPending)?'fertilizer':'clay');
  if (AutoPlay.poppingWrinklers && game.plants['wrinklegill'].unlocked) return 'wrinklegill'; // faster wrinklers
  //use garden to get cps and sugarlumps
  if (game.plants['bakeberry'].unlocked &&
      AutoPlay.lumpRelatedAchievements.every(function(a) {
        return Game.AchievementsById[a].won; }))
    return 'bakeberry'; // 1% cps add. + harvest 30 mins with high ratio
  if (game.plants['whiskerbloom'].unlocked) return 'whiskerbloom'; // ca. 1.5% cps
  return 'bakerWheat'; // nothing else works
}

AutoPlay.cleaningGarden = function(game) {
  if (Game.Objects["Farm"].level<4) {
    if (AutoPlay.plantList[0]==0) return;
    for (var y = 2; y<5; y++) {
      AutoPlay.cleanSeed(game,2,y);
      AutoPlay.cleanSeed(game,4,y);
    }
  } else if (Game.Objects["Farm"].level==4) {
    for (var y = 2; y<5; y++) {
      AutoPlay.cleanSeed(game,2,y);
      AutoPlay.cleanSeed(game,3,y);
    }
  } else {
    for (var sector = 0; sector<4; sector++)
      AutoPlay.cleanSector(game,sector,
          AutoPlay.plantDependencies[AutoPlay.plantList[sector]][0]);
  }
}

AutoPlay.cleanSector = function(game,sector,plant0) {
  if (plant0=="dummy") return; // do not clean when we are at work
  var X = (sector%2)?0:3, Y = (sector>1)?0:3;
  if (plant0=="queenbeetLump") { AutoPlay.cleanSeed(game,X+1,Y+1); return; }
  if (plant0=="everdaisy") {
    for (var y = Y; y<Y+3; y++) AutoPlay.cleanSeed(game,X+1,y);
    return;
  }
  if (plant0=="all") {
    for (var x = X; x<X+3; x++) for (var y = Y; y<Y+3; y++)
      if((x!=X+1)||(y!=Y+1)) { // we do not really need that if, do we?
        var tile=game.getTile(x,y);
        if ((tile[0]>=1) && game.plantsById[tile[0]-1].unlocked) game.harvest(x,y);
      }
    return;
  }
  for (var y = Y; y<Y+3; y++) {
    AutoPlay.cleanSeed(game,X,y);
    AutoPlay.cleanSeed(game,X+2,y);
  }
}

AutoPlay.harvestable=
  ['bakeberry','chocoroot','whiteChocoroot','queenbeet','queenbeetLump','duketater'];

AutoPlay.cleanSeed = function(game,x,y) {
  if (!game.isTileUnlocked(x,y)) return;
  var tile = game.getTile(x,y);
  if (tile[0]==0) return;
  var plant = game.plantsById[tile[0]-1];
  if (!plant.unlocked && tile[1]<=plant.mature) return;
  if (AutoPlay.harvestable.indexOf(plant.key)>=0 && tile[1] && tile[1]<=plant.mature)
    return; // do not clean harvestable plants
  game.harvest(x,y);
}

// could harvest cookie-giving plants while slot 0 produces plants
// this is difficult since harvesting is not related to sectors
AutoPlay.harvesting = function(game) {
  AutoPlay.cleaningGarden(game);
  AutoPlay.plantPending=false;
  AutoPlay.harvestPlant=false;
  for (var x = 0; x<6; x++) for (var y = 0; y<6; y++)
    if (game.isTileUnlocked(x,y)) {
      var tile = game.getTile(x,y);
      if (tile[0]) {
        var plant=game.plantsById[tile[0]-1];
        if (!plant.unlocked) {
          AutoPlay.plantPending=true;
          AutoPlay.addActivity(plant.name + " is still growing, do not disturb!");
          if (tile[1]>=game.plantsById[tile[0]-1].mature)
            game.harvest(x,y); // is mature
        } else if (AutoPlay.harvestable.indexOf(plant.key)>=0) {
          AutoPlay.harvestPlant = true;
          AutoPlay.addActivity("Waiting to harvest " + plant.name + ".");
          if (game.plantsUnlockedN==game.plantsN && tile[1]>=game.plantsById[tile[0]-1].mature) { // is mature
            if (AutoPlay.cpsMult>300) game.harvest(x,y); // harvest when it pays
          }
        }
        if (AutoPlay.plantCookies && tile[1]>=game.plantsById[tile[0]-1].mature)
          if (!AutoPlay.plantsMissing || !game.isTileUnlocked(x-x%3,y-y%3))
            game.harvest(x,y); // is mature and can give cookies
        if (plant.ageTick+plant.ageTickR+tile[1] >= 100) {
          // check if the plant is immortal. If so, do not harvest it. Elderworts and Everdaisies are the only immortal plants. Fixes #66.
          if (!(plant.name == "Elderwort" || plant.name == "Everdaisy")) {
            AutoPlay.harvest(game,x,y); // would die in next round
          }
        }
      }
    }
}

AutoPlay.harvest = function(game,x,y) {
  game.harvest(x,y);
  var sector = ((x<3)?1:0)+((y<3)?2:0);
  if (AutoPlay.plantList[sector] == 1) AutoPlay.cleanSector(game,sector,"all");
}

AutoPlay.switchSoil = function(game,sector,which) {
  if (sector) return;
  if (game.nextSoil>AutoPlay.now) return;
  var me=game.soils[which];
  if (game.soil==me.id || game.parent.bought<me.req) return;
  FireEvent(l('gardenSoil-'+Game.Objects["Farm"].minigame.soils[which].id),'click');
}

// banks: stock market =============================




//===================== Handle Wrinklers ==========================
AutoPlay.nextWrinkler = -1;
AutoPlay.poppingWrinklers = false;
AutoPlay.wrinklerTime = Date.now();



AutoPlay.findNextWrinkler = function() {
  let next = -1;
  let maxSucked = 0;
  for (var w of Game.wrinklers){
    if (w.close == 0 && w.id < Game.getWrinklersMax()) { // empty spot
      AutoPlay.nextWrinkler = -1;
      return;
    }
    else if (w.sucked > maxSucked){
      maxSucked = w.sucked;
      next = w.id;
    }
  }
  AutoPlay.nextWrinkler = next;
}

//===================== Handle Small Achievements ==========================
AutoPlay.backupHeight = 0;

AutoPlay.giftCode = 0;






//===================== Handle Ascend ==========================
AutoPlay.ascendLimit = 0.9*Math.floor(2*(1-Game.ascendMeterPercent));
AutoPlay.wantAscend = false;
AutoPlay.onAscend = false;

AutoPlay.handleAscend = function() {
  if (!hooks.settings.autoAscend) return;
  if (Game.OnAscend) {
    AutoPlay.doReincarnate();
    AutoPlay.findNextAchievement();
    AutoPlay.setDeadline(0); // reactivate all activities
    AutoPlay.savingsStart = AutoPlay.now;
    AutoPlay.onAscend=false;
    return;
  }
  if (AutoPlay.onAscend && Game.AscendTimer==0) Game.Ascend(true);
  if (Game.ascensionMode == 0 && Game.prestige == 0)
    AutoPlay.canContinue();  // update achievement goals
  if (Game.AchievementsById[AutoPlay.nextAchievement].won) {
    var date = new Date();
    date.setTime(AutoPlay.now-Game.startDate);
    var legacyTime = Game.sayTime(date.getTime()/1000*Game.fps,-1);
    date.setTime(AutoPlay.now-Game.fullDate);
    var fullTime=Game.sayTime(date.getTime()/1000*Game.fps,-1);
    AutoPlay.doAscend("have achievement: " +
      Game.AchievementsById[AutoPlay.nextAchievement].ddesc.replace(/<q>.*?<\/q>/ig, '') +
      " after " + legacyTime + "(total: " + fullTime + ")",1);
    return;
  }
  if (Game.ascensionMode==1 && !AutoPlay.canContinue() && !Game.AchievementsById[AutoPlay.nextAchievement].won) {
    AutoPlay.doAscend("reborn mode did not work, retry.",0);
    return;
  }
  if (AutoPlay.preNightMode() && AutoPlay.Config.NightMode>0)
    return; //do not ascend right before the night
  if (!Game.Achievements["Endless cycle"].won &&
      !Game.ascensionMode && Game.Upgrades["Sucralosia Inutilis"].bought &&
      Game.Upgrades['Lucky payout'].bought) {
    // this costs approx. 1 minute per ascend
    AutoPlay.activities = "Going for 1000 ascends.";
    AutoPlay.hyperActive=true; // full activity
    AutoPlay.wantAscend = true; //avoid buying plants
    if ((Game.ascendMeterLevel>0) /*&&
         (AutoPlay.ascendLimit<Game.ascendMeterLevel*Game.ascendMeterPercent ||
            (Game.prestige+Game.ascendMeterLevel)%1000==777)*/) {
      AutoPlay.doAscend("go for 1000 ascends",0);
      return;
    }
  }
  if (Game.Upgrades["Permanent upgrade slot V"].bought &&
      !Game.Achievements["Reincarnation"].won && !Game.ascensionMode) {
    // this costs 3+2 minute per 2 ascend
    AutoPlay.activities = "Going for 100 ascends.";
    AutoPlay.hyperActive=true; // full activity
    AutoPlay.wantAscend = true; //avoid buying plants
    if (Game.ascendMeterLevel>0 &&
        AutoPlay.ascendLimit<Game.ascendMeterLevel*Game.ascendMeterPercent) {
      AutoPlay.doAscend("go for 100 ascends",0);
      return;
    }
  }
  var daysInRun = (AutoPlay.now-Game.startDate)/1000/60/60/24;
  if (AutoPlay.nextAchievement==463 && daysInRun > 10 && Game.Objects["Bank"].minigame.profit > daysInRun*300000) {
    AutoPlay.addActivity("Making money in stock market for achievements.");
  } else {
    var maxDaysInRun =
          40*(Game.prestige+1000000000)/(Game.ascendMeterLevel+1);
    maxDaysInRun *= maxDaysInRun; // square the amount
    if (!AutoPlay.wantAscend && daysInRun>20)
      AutoPlay.addActivity("Still " + Beautify(maxDaysInRun-daysInRun) +
          " days until next hard ascend.");
    if (daysInRun>maxDaysInRun && daysInRun>20) {
      for (var x = Game.cookiesEarned; x>10; x/=10);
      // do not ascend if the first digit of the total cookies is a 9
      if (x<9) {
        AutoPlay.doAscend("ascend after " + (daysInRun<<0) +
            " days just while waiting for next achievement.",1);
        return;
      }
    }
  }
  if (!Game.Upgrades["Lucky digit"].bought && Game.heavenlyChips>777 &&
      Game.ascendMeterLevel>0 && Game.ascendMeterLevel<20 && ((Game.prestige+Game.ascendMeterLevel)%10 == 7)) {
    AutoPlay.doAscend("ascend for heavenly upgrade lucky digit.",0);
    return;
  }
  if (!Game.Upgrades["Lucky number"].bought && Game.heavenlyChips>77777 &&
      Game.ascendMeterLevel>0 && Game.ascendMeterLevel<200 && ((Game.prestige+Game.ascendMeterLevel)%1000 == 777)) {
    AutoPlay.doAscend("ascend for heavenly upgrade lucky number.",0);
    return;
  }
  if (!Game.Upgrades["Lucky payout"].bought && Game.heavenlyChips>77777777) {
    // now we only need six number 7 in the prestige - easy with higher prestige
    var newPrestige = Game.prestige+Game.ascendMeterLevel;
    AutoPlay.wantAscend = true; //avoid buying plants
    AutoPlay.hyperActive=true; //full activity
    AutoPlay.addActivity("Trying to get heavenly upgrade Lucky Payout.");
    if (Math.ceil(((newPrestige+'').split('7').length-1))>=4) {
      AutoPlay.doAscend("ascend for heavenly upgrade lucky payout.",0);
      return;
    }
  }
  if (!Game.Upgrades["Season switcher"].bought &&
      AutoPlay.nextAchievement==108 && Game.ascendMeterLevel>1111) {
    AutoPlay.doAscend("getting season switcher.",1);
    return;
  }
}

AutoPlay.neverclickWarn=true;





AutoPlay.mustRebornAscend = function() {
  return !([78,93,94,95].every(function(a) { return Game.AchievementsById[a].won; }));
}



//===================== Handle Achievements ==========================
AutoPlay.nextAchievement=AutoPlay.wantedAchievements[0];

AutoPlay.endPhase = function() {
  return AutoPlay.wantedAchievements.indexOf(AutoPlay.nextAchievement)<0;
}

AutoPlay.grinding = function() {
  let grindingStart=AutoPlay.wantedAchievements[AutoPlay.wantedAchievements.length-10];
  if (Game.AchievementsById[grindingStart].won) { // grind for the last 7 big achievements
    if (!AutoPlay.endPhase()) {
      AutoPlay.addActivity('Grinding cookies - do not sleep at night.');
      return true;
    }
  }
  return false;
}



AutoPlay.mainActivity = "Doing nothing in particular.";
AutoPlay.activities = AutoPlay.mainActivity;

AutoPlay.setMainActivity = function(str) {
  AutoPlay.mainActivity = str;
  AutoPlay.info(str);
}







//===================== Handle Heavenly Upgrades ==========================
AutoPlay.buyHeavenlyUpgrades = function() {
  AutoPlay.prioUpgrades.forEach(function(id) {
    var e = Game.UpgradesById[id];
    if (e.canBePurchased && !e.bought && e.buy(true)) {
      AutoPlay.info("buying "+e.name);
    }
  });
  for (var me in Game.UpgradesById) {
      var e = Game.UpgradesById[me];
      if (e.canBePurchased && !e.bought && e.buy(true)) {
          AutoPlay.info("buying " + e.name);
      }
  };
  AutoPlay.assignPermanentSlot(1,AutoPlay.kittens);
  AutoPlay.assignPermanentSlot(2,AutoPlay.maxBuildings);
  if (!Game.Achievements["Reincarnation"].won) { // for many ascends
    AutoPlay.assignPermanentSlot(0,AutoPlay.cursors);
    AutoPlay.assignPermanentSlot(3,[52]); // lucky day
    AutoPlay.assignPermanentSlot(4,[53]); // serendipity
  } else { //collect rare things
    AutoPlay.assignPermanentSlot(0,AutoPlay.butterBiscuits);
    AutoPlay.assignPermanentSlot(3,[226]); // omelette
    AutoPlay.assignPermanentSlot(4,AutoPlay.expensive);
  }
}



//===================== Handle Dragon ==========================
AutoPlay.handleDragon = function() {
  var wantedAura=0;
  if (Game.Upgrades["A crumbly egg"].unlocked) {
    if (Game.dragonLevel<Game.dragonLevels.length-1 &&
        Game.dragonLevels[Game.dragonLevel].cost()) {
      let obj = null;
      if (Game.dragonLevel >=5 && Game.dragonLevel < Game.dragonLevels.length-3)
        obj = Game.ObjectsById[Game.dragonLevel - 5];
      else if (Game.dragonLevel >= Game.dragonLevels.length-3)
        obj = 'buy150';
      Game.specialTab = "dragon";
      Game.UpgradeDragon();
      Game.ToggleSpecialMenu(0);
      if (obj == null)
        return;
      if (obj == 'buy150') {  // after sacrificing 50 or 200 of all
        // handle garden before buying (low cps)
        if (Game.Objects['Farm'].amount == 0)
          Game.Objects['Farm'].buy(1);
        AutoPlay.handleMinigames()
        for (var o of Game.ObjectsById)
          o.buy(150 - o.amount);
      }
      else  // after sacrificing 100, get 50 back immediately
        obj.buy(50 - obj.amount);
    }
    AutoPlay.petDragon();
  }
  if (Game.dragonLevel>=5) wantedAura=1; // kitten (breath of milk)
  if (Game.dragonLevel>=19) wantedAura=15; // radiant appetite
  if (Game.dragonLevel>=21) wantedAura=17; // fractal (dragons curve)
  if ((Game.dragonLevel>=21) && (Game.lumps > 99) &&
      !AutoPlay.lumpHarvestAchievements.includes(AutoPlay.nextAchievement)) // keep dragons curve for lump harvest achievements
    wantedAura=15; // radiant appetite
  if (Game.dragonAura!=wantedAura) {
    Game.specialTab = "dragon"; Game.SetDragonAura(wantedAura,0);
    Game.ConfirmPrompt(); Game.ToggleSpecialMenu(0);
  }
  if ((Game.dragonAura2!=1) &&
      (Game.dragonLevel>=Game.dragonLevels.length-1)) {
  // set second aura to kitten (breath of milk)
    Game.specialTab = "dragon"; Game.SetDragonAura(1,1);
    Game.ConfirmPrompt(); Game.ToggleSpecialMenu(0);
} }

AutoPlay.checkDragon = function(building) {
  // determine if buying the building is efficient based on sacrifices to krumblor
  if(!Game.Achievements['Here be dragon'].won)
    return true;  // don't limit when first fully training

  building = Game.Objects[building]

  // haven't sacrificed first 100, buy no more than 100
  if(Game.dragonLevel - 5 <= building.id)
    return building.amount < 100;

  // waiting to sacrifice 50 of all
  if(Game.dragonLevel < Game.dragonLevels.length-2)
    return building.amount < 50;

  // waiting to sacrifice 200 of all
  if(Game.dragonLevel < Game.dragonLevels.length-1)
    return building.amount < 200;

  return true;
}

AutoPlay.petDragon = function() {
  if (Game.dragonLevel>=8) { // can pet the dragon
    var drops=['Dragon scale','Dragon claw','Dragon fang','Dragon teddy bear'];
    for (var drop of drops) {
      if (!Game.Has(drop) && !Game.HasUnlocked(drop)) { // still something we can get
        AutoPlay.addActivity("Petting the dragon.");
        Game.specialTab = "dragon";
        Game.ToggleSpecialMenu(1);
        Game.ClickSpecialPic();
        Game.ToggleSpecialMenu(0);
        return;
      }
    }
  }
}

//===================== Auxiliary ==========================





AutoPlay.status = function(print=true) { // just for testing purposes
  var ach=0;
  var sach=0;
  var up=0;
  var lum=0;
  let nonUp=[71,72,73,87,227];
  for (var a in Game.Achievements) {
    var me = Game.Achievements[a];
    if (!me.won && me.pool!="dungeon") { // missing achievement
      if (print) AutoPlay.info("Missing achievement #" + me.id +
        ": " + me.ddesc.replace(/<q>.*?<\/q>/ig, ''));
      if (me.pool=="shadow") sach++;
      ach++;
    }
  }
  for (var i in Game.Upgrades) {
    var me = Game.Upgrades[i];
    if (!me.bought && me.pool!="debug" && me.pool!="toggle") {
      if (Game.resets && nonUp.includes(me.id)) continue;
      if (print) AutoPlay.info("Upgrade " + me.name + " is missing.");
      up++;
    }
  }
  for (var o in Game.Objects) {
    var me = Game.Objects[o];
    var maxl = 10;
    var myl = 0;
    if (me.id==0) maxl=12; // cursors need level 12
    for (var l=me.level+1; l<=maxl; l++) myl+=l;
    if (print && myl) AutoPlay.info(""+myl+" sugar lumps missing for " + me.name + ".");
	lum+=myl;
  }
  lum-=Game.lumps;
  if (lum<0) lum=0;
  AutoPlay.addActivity("Missing "+(ach)+" achievements ("+sach+" shadow), "+up+" upgrades, and "+lum+" sugar lumps.");
}

AutoPlay.setDeadline = function(d) {
  if (AutoPlay.deadline>d) AutoPlay.deadline=d;
}









function range(start, end) {
  var foo = [];
  for (var i = start; i<=end; i++) { foo.push(i); }
  return foo;
}



AutoPlay.addActivity = function(str) {
  if (!AutoPlay.activities.includes(str)) {
    AutoPlay.activities+= '<div class="line"></div>'+str;
    return true;
  } else return false;
}


// CookiePilot's reviewed replacement actions. Runs in the strategy factory scope.
AutoPlay.Config = { NightMode: 0, ClickMode: 1, GoldenClickMode: 2, SavingStrategy: 1 };
AutoPlay.cheatLumps = false; // A read-only strategy condition used by the Pantheon.
AutoPlay.resetTime = Date.now();
AutoPlay.giftCode = hooks.state.giftCode || '';
AutoPlay.giftTime = hooks.state.giftTime || 0;
AutoPlay.preNightMode = function() { return false; };
AutoPlay.info = function(message) { hooks.log(message); };
AutoPlay.logging = function() {};
AutoPlay.debugLogging = function() {};
const won = name => !!Game.Achievements[name]?.won;
const legitAchievement = a => a && a.pool !== 'dungeon' && a.name !== 'Cheated cookies taste awful';
const unmetChallenge = () => !won('True Neverclick') || !won('Neverclick') || !won('Hardcore');
const validChallengeRun = () => Game.ascensionMode === 1 || (!Game.resets && !Game.prestige);

AutoPlay.handleClicking = function() {
  if (AutoPlay.nextAchievement === 397 || hooks.isInputBusy()) return;
  if (validChallengeRun() && ((!won('True Neverclick') && Game.cookieClicks === 0) ||
      (!won('Neverclick') && Game.cookieClicks <= 15))) return;
  // Never supply ClickCookie's optional amount argument; the game computes the reward.
  Game.ClickCookie();
};
AutoPlay.bestBuy = function() {
  hooks.choosePurchase(AutoPlay);
};
AutoPlay.handleGoldenCookies = function() {
  if (Game.TickerEffect && Game.tickerL) Game.tickerL.click();
  const golden = Game.shimmers.filter(s => s.type === 'golden' && s.force !== 'cookie storm drop');
  if (!won('Four-leaf cookie') && golden.length >= 4) return;
  for (const shimmer of [...Game.shimmers]) {
    if (shimmer.type === 'golden' && shimmer.force !== 'cookie storm drop') {
      if (!won('Four-leaf cookie') && golden.length >= 2 && shimmer.life > Game.fps * 2) continue;
      if (!won('Fading luck') && won('Early bird') && shimmer.life > Game.fps &&
          shimmer.life < shimmer.dur * Game.fps - 2 * Game.fps && !Game.hasBuff('Click frenzy')) continue;
    }
    shimmer.pop();
  }
};
AutoPlay.handleSugarLumps = function() {
  if (!Game.canLumps() || Game.ascensionMode === 1) return;
  const age = AutoPlay.now - Game.lumpT;
  if (age >= Game.lumpRipeAge || (age >= Game.lumpMatureAge &&
      Game.lumpCurrentType === 0 && AutoPlay.minLumpsOK && !won('Hand-picked'))) Game.clickLump();
  AutoPlay.useLump();
};
AutoPlay.handleWrinklers = function() {
  if (!Game.Has('One mind')) return;
  const active = Game.wrinklers.filter(w => w.close === 1 && w.hp > 0.5);
  if (!active.length) return;
  const poker = active.find(w => w.type === 0);
  if (!won('Wrinkler poker') && poker) {
    // Wait for natural HP regeneration between pokes, so this wrinkler survives 50 clicks.
    if (poker.hp >= Game.wrinklerHP - 0.05) hooks.pokeWrinkler(poker);
    return;
  }
  const dropping = ['easter', 'halloween'].includes(Game.season) && !AutoPlay.seasonFinished(Game.season);
  const hunting = Game.Has('Unholy bait') && (!won('Moistburster') || !won('Last Chance to See'));
  const shiny = active.find(w => w.type === 1);
  if (shiny && !won('Last Chance to See')) { hooks.pokeWrinkler(shiny); return; }
  if (dropping || hunting || Date.now() - AutoPlay.wrinklerTime > 7200000) {
    AutoPlay.poppingWrinklers = true;
    hooks.pokeWrinkler(active.find(w => w.type === 0) || active[0]);
    if (active.some(w => w.hp <= 1.3)) AutoPlay.wrinklerTime = Date.now();
  }
};
AutoPlay.handleSeasons = function() {
  if (Game.Has('A festive hat') && !Game.HasUnlocked("Santa's dominion")) {
    Game.specialTab = 'santa';
    Game.UpgradeSanta();
    Game.ToggleSpecialMenu(0);
  }
  if (Game.season === 'christmas' && !won("Baby it's old outside")) hooks.clickElf();
  if (!Game.Has('Season switcher') || Game.ascensionMode === 1 || Game.seasonUses > 20) return;
  if (AutoPlay.seasonFinished(Game.season)) {
    const next = { christmas: 'Lovesick biscuit', valentines: 'Bunny biscuit', easter: 'Ghostly biscuit' };
    Game.Upgrades[next[Game.season] || 'Festive biscuit']?.buy();
  }
};
function renameBakery(name) {
  Game.bakeryNamePrompt();
  const input = document.getElementById('bakeryNameInput');
  if (input) { input.value = name; Game.ConfirmPrompt(); }
}
AutoPlay.handleSmallAchievements = function() {
  if (!won('Tabloid addiction')) for (let i = 0; i < 50; i++) Game.tickerL.click();
  if (!won('Here you go')) Game.Achievements['Here you go']?.click();
  if (!won('Tiny cookie')) Game.ClickTinyCookie();
  if (!won('God complex') || !won("What's in a name")) {
    const previous = Game.bakeryName;
    renameBakery('Orteil');
    renameBakery(previous);
  }
  if (!won('Olden days')) {
    const previous = Game.onMenu;
    Game.ShowMenu('log');
    document.querySelector('#oldenDays [onclick], #oldenDays .icon')?.click();
    Game.ShowMenu(previous);
  }
  if (!won('Stifling the press') && Game.windowW < Game.tickerTooNarrow) Game.tickerL.click();
  if ((!won('Cookie-dunker') && Game.milkProgress > 0.7) || !won('Stifling the press')) hooks.windowAchievements();
  if (!won('In her likeness') && Game.Objects.You?.amount > 0 && Game.YouCustomizer) {
    // Only use the same gene-step operation as the arrows in the game's clone editor.
    for (const [gene, target] of [['hair', 9], ['hairCol', 6], ['head', 3], ['acc1', 0], ['acc2', 3]]) {
      const entry = Game.YouCustomizer.genesById[gene];
      if (entry) {
        const current = Game.YouCustomizer.currentGenes[entry.n];
        if (current !== target) Game.YouCustomizer.offsetGene(gene, target - current);
      }
    }
  }
  AutoPlay.handleGift();
};
AutoPlay.handleGift = function() {
  if (won('No time like the present') || !Game.Has('Wrapping paper') || Game.ascensionMode) return;
  if (AutoPlay.giftCode && Date.now() - AutoPlay.giftTime > 90000000) {
    AutoPlay.giftCode = ''; hooks.persist({ giftCode: '', giftTime: 0 });
  }
  if (AutoPlay.giftCode && Date.now() - AutoPlay.giftTime >= 3660000) {
    Game.promptGiftRedeem();
    const code = document.getElementById('giftCode');
    if (!code) return;
    code.value = AutoPlay.giftCode;
    code.dispatchEvent(new Event('change', { bubbles: true }));
    document.getElementById('promptOption0')?.click();
    Game.ClosePrompt();
    if (won('No time like the present')) {
      AutoPlay.giftCode = ''; hooks.persist({ giftCode: '', giftTime: 0 });
    }
  } else if (!AutoPlay.giftCode && !Game.hasBuff('Gifted out') && Game.cookies >= 1e9) {
    Game.promptGiftSend();
    const amount = document.getElementById('giftAmount');
    if (!amount) return;
    amount.value = '42';
    document.getElementById('giftMessage').value = 'CookiePilot';
    document.getElementById('promptOption0')?.click();
    const code = document.getElementById('giftCode')?.value;
    Game.ClosePrompt();
    if (code) {
      AutoPlay.giftCode = code; AutoPlay.giftTime = Date.now();
      hooks.persist({ giftCode: code, giftTime: AutoPlay.giftTime });
    }
  }
};
AutoPlay.canContinue = function() {
  if (validChallengeRun() && ((!won('True Neverclick') && !Game.cookieClicks) ||
      (!won('Neverclick') && Game.cookieClicks <= 15) || (!won('Hardcore') && !Game.UpgradesOwned))) return true;
  if (!won('Speed baking III') && Date.now() - Game.startDate <= 900000 && validChallengeRun()) {
    AutoPlay.hyperActive = true; return true;
  }
  return false;
};
AutoPlay.assignPermanentSlot = function(slot, options) {
  if (!Game.UpgradesById[264 + slot]?.bought) return;
  for (let i = options.length - 1; i >= 0; i--) {
    const upgrade = Game.UpgradesById[options[i]];
    if (!upgrade?.bought || !upgrade.unlocked || upgrade.noPerm || !['', 'cookie'].includes(upgrade.pool)) continue;
    if (Game.permanentUpgrades.some((id, other) => other !== slot && id === upgrade.id)) continue;
    if (Game.permanentUpgrades[slot] === upgrade.id) return;
    Game.AssignPermanentSlot(slot);
    Game.PutUpgradeInPermanentSlot(upgrade.id, slot);
    Game.ConfirmPrompt();
    return;
  }
};
AutoPlay.doReincarnate = function() {
  AutoPlay.onAscend = false;
  AutoPlay.delay = 10;
  AutoPlay.buyHeavenlyUpgrades();
  const challenge = unmetChallenge() || !won('Speed baking III');
  // This is the selection state used by the game's ascension-mode prompt.
  Game.PickAscensionMode(); Game.nextAscensionMode = challenge ? 1 : 0; Game.ConfirmPrompt();
  Game.Reincarnate(true);
  AutoPlay.resetTime = Date.now();
  AutoPlay.goodsList = null;
  AutoPlay.plantList = [0, 0, 0, 0];
  AutoPlay.ascendLimit = 0.9 * Math.floor(2 * (1 - Game.ascendMeterPercent));
};
AutoPlay.doAscend = function(reason, log) {
  if (!hooks.settings.autoAscend || Game.AscendTimer > 0 || Game.ReincarnateTimer > 0 ||
      AutoPlay.onAscend || Game.OnAscend) return;
  if (AutoPlay.nextAchievement === 397 && Math.round(Game.cookies) === 1e12) {
    if (!hooks.checkpoint('Vor Aufstieg: exakt eine Billion')) return;
    Game.Ascend(true); AutoPlay.onAscend = true; return;
  }
  AutoPlay.wantAscend = !!AutoPlay.plantPending;
  if (AutoPlay.wantAscend || Game.hasBuff('Sugar frenzy') || Game.hasBuff('Sugar blessing')) return;
  const market = Game.Objects.Bank?.minigame;
  // Do not destroy months of market profit while pursuing this one-ascension achievement.
  if (AutoPlay.nextAchievement === Game.Achievements['Gaseous assets']?.id &&
      market && market.profit > 0 && !won('Gaseous assets')) return;
  if (!hooks.checkpoint('Vor Aufstieg: ' + reason)) return;
  const active = Game.wrinklers.find(w => w.close === 1 && w.hp > 0.5);
  if (active) { hooks.pokeWrinkler(active); return; }
  if (Game.wrinklers.some(w => w.phase > 0 && w.hp <= 0.5)) return; // let the game pay out first
  if (Game.isMinigameReady(Game.Objects.Farm)) Game.Objects.Farm.minigame.harvestAll();
  if (Game.isMinigameReady(Game.Objects.Bank)) {
    for (const good of market.goodsById) market.sellGood(good.id, Math.floor(good.stock));
  }
  if (Game.HasUnlocked('Chocolate egg') && !Game.Has('Chocolate egg')) {
    if (Game.dragonLevel >= 9) {
      Game.specialTab = 'dragon'; Game.SetDragonAura(5, 0); Game.ConfirmPrompt(); Game.ToggleSpecialMenu(0);
    }
    for (const building of Game.ObjectsById) building.sell(building.amount);
    Game.Upgrades['Chocolate egg'].buy(); AutoPlay.delay = 10; return;
  }
  hooks.log(reason); AutoPlay.delay = 15;
  Game.Ascend(true); AutoPlay.onAscend = true;
};
AutoPlay.checkAllAchievementsOK = function() {
  const pending = Object.values(Game.AchievementsById).filter(a => legitAchievement(a) && !a.won);
  const late = new Set(AutoPlay.lateAchievements);
  // Finish the market before long waits; keeping the run protects Gaseous assets.
  const marketGoal = Game.Achievements['Gaseous assets'];
  let next = pending.find(a => !late.has(a.id));
  if (marketGoal && !marketGoal.won && pending.every(a => late.has(a.id) ||
      ['Gaseous assets', 'Liquid assets', 'Just plain lucky'].includes(a.name))) next = marketGoal;
  next ||= pending[0];
  if (next) {
    AutoPlay.finished = false;
    AutoPlay.nextAchievement = next.id;
    AutoPlay.setMainActivity('Ziel: ' + next.name + ' – ' + (next.ddesc || next.desc || '').replace(/<[^>]*>/g, ''));
    return false;
  }
  const missing = Object.values(Game.UpgradesById).find(u => u.pool === 'prestige' && !u.bought);
  if (missing) {
    AutoPlay.nextAchievement = 99;
    AutoPlay.setMainActivity('Himmlisches Upgrade: ' + missing.name); return false;
  }
  AutoPlay.finished = true; AutoPlay.nextAchievement = 99;
  AutoPlay.setMainActivity('Alle legitimen Achievements dieses Spielstands erreicht.'); return true;
};
AutoPlay.findNextAchievement = function() {
  AutoPlay.wantAscend = false;
  AutoPlay.handleSmallAchievements();
  const next = AutoPlay.wantedAchievements.map(id => Game.AchievementsById[id]).find(a => a && !a.won);
  if (!next) return AutoPlay.checkAllAchievementsOK();
  AutoPlay.nextAchievement = next.id;
  const description = (next.ddesc || next.desc || '').replace(/<[^>]*>/g, '').trim();
  AutoPlay.setMainActivity('Ziel: ' + (next.dname || next.name) + (description ? ' – ' + description : ''));
};
AutoPlay.handleStockMarket = function() {
  if (Game.ascensionMode || !Game.isMinigameReady(Game.Objects.Bank) || AutoPlay.wantAscend) return;
  const market = Game.Objects.Bank.minigame;
  if (market.brokers < market.getMaxBrokers() && market.getBrokerPrice() * 100 < Game.cookies) {
    document.getElementById('bankBrokersBuy')?.click();
  }
  if (market.officeLevel < market.offices.length - 1) {
    const office = market.offices[market.officeLevel];
    if (office.cost && Game.Objects.Cursor.amount >= office.cost[0] && Game.Objects.Cursor.level >= office.cost[1]) {
      document.getElementById('bankOfficeUpgrade')?.click();
    }
  }
  if (!won('Debt evasion') && !AutoPlay.plantPending && market.officeLevel >= 4 &&
      AutoPlay.nextAchievement === Game.Achievements['Debt evasion']?.id && hooks.settings.autoAscend) {
    const before = Game.hasBuff('Loan 2');
    if (!before) document.getElementById('bankLoan2')?.click();
    if (Game.hasBuff('Loan 2')) AutoPlay.doAscend('Debt evasion: laufenden Kredit verlassen', 0);
  }
  AutoPlay.goodsList ||= [];
  for (const good of market.goodsById) {
    const price = market.getGoodPrice(good);
    const max = Math.floor(market.getGoodMaxStock(good));
    if (!(price > 0 && Number.isFinite(price) && max > 0)) continue;
    const quote = AutoPlay.goodsList[good.id] ||= { previous: price, boughtAt: null };
    if (quote.previous === price) continue;
    const rest = market.getRestingVal(good.id);
    if (!won('Buy buy buy') && max >= 500 && good.stock < 500 && price < rest * 0.7) {
      market.buyGood(good.id, Math.max(0, Math.floor(500 - good.stock)));
    }
    if (good.stock < max && price < rest * 0.65 && price >= quote.previous) {
      const previousStock = good.stock;
      market.buyGood(good.id, Math.max(0, Math.floor(max - good.stock)));
      if (good.stock > previousStock) quote.boughtAt = price;
    } else if (good.stock > 0 && price > rest && price < quote.previous &&
        (quote.boughtAt === null || price > quote.boughtAt * 1.25)) {
      market.sellGood(good.id, Math.floor(good.stock)); quote.boughtAt = null;
    }
    quote.previous = price;
  }
};

// Keep the existing exact-cookie strategy, but every reward still comes from the game.
AutoPlay.runJustRight = function() {
  AutoPlay.savingsGoal = 0;
  AutoPlay.activities = 'Exakt eine Billion Cookies für den Aufstieg erreichen.';
  if (Game.OnAscend) { AutoPlay.handleAscend(); return; }
  if (Math.round(Game.cookies) === 1e12) { AutoPlay.doAscend('Exakt eine Billion', 1); return; }
  const difference = 1e12 - Game.cookies;
  if (difference < 0) {
    // Spend ordinary cookies on a purchase, then approach the target again.
    const candidates = Game.ObjectsById.filter(b => b.getPrice() < Game.cookies && b.getPrice() > -difference);
    const item = candidates.sort((a, b) => a.getPrice() - b.getPrice())[0];
    if (item) item.buy(1);
    else AutoPlay.doAscend('Exakte Billion verpasst; normaler neuer Versuch', 0);
    return;
  }
  if (Game.BuildingsOwned) {
    // Selling pays cookies. Start removing buildings while still far away from the target.
    if (difference < Game.cookiesPs * 120 + Game.ObjectsById.reduce((s, b) => s + b.getReverseSumPrice(b.amount), 0)) {
      for (const b of [...Game.ObjectsById].reverse()) if (b.amount) { b.sell(b.amount); return; }
    }
  }
  if (!Game.BuildingsOwned && difference <= 1e6) { Game.ClickCookie(); return; }
  if (difference > Math.max(Game.cookiesPs * 300, 1e6)) {
    for (const b of [...Game.ObjectsById].reverse()) {
      if (b.getPrice() < Game.cookies * 0.01 && b.amount < 100) { b.buy(1); return; }
    }
  }
  if (!Game.BuildingsOwned && difference > 1e6) Game.Objects.Cursor.buy(1);
};
AutoPlay.run = function() {
  if (Game.AscendTimer > 0 || Game.ReincarnateTimer > 0) return;
  if (AutoPlay.delay > 0) { AutoPlay.delay--; return; }
  AutoPlay.now = Date.now();
  AutoPlay.cpsMult = Game.unbuffedCps > 0 ? Game.cookiesPs / Game.unbuffedCps : 1;
  if (AutoPlay.nextAchievement === 397 && !won('When the cookies ascend just right')) {
    AutoPlay.runJustRight(); return;
  }
  if (Game.OnAscend) { AutoPlay.handleAscend(); return; }
  AutoPlay.handleGoldenCookies();
  AutoPlay.handleWrinklers();
  AutoPlay.handleSpeedMinigames();
  if (AutoPlay.now - (AutoPlay.lastPurchase || 0) > 500) {
    AutoPlay.lastPurchase = AutoPlay.now; AutoPlay.bestBuy();
  }
  if (Game.ascensionMode === 1 || AutoPlay.onAscend || AutoPlay.hyperActive) AutoPlay.handleAscend();
  if (AutoPlay.now < AutoPlay.deadline) return;
  AutoPlay.activities = AutoPlay.mainActivity;
  AutoPlay.deadline = AutoPlay.now + 5000;
  // Keep a completed target until its automatic ascension has finished.
  if (AutoPlay.finished || (!hooks.settings.autoAscend && Game.AchievementsById[AutoPlay.nextAchievement]?.won)) AutoPlay.findNextAchievement();
  AutoPlay.handleSugarLumps();
  AutoPlay.handleSavings();
  AutoPlay.handleSeasons();
  AutoPlay.handleDragon();
  AutoPlay.handleMinigames();
  AutoPlay.handleSmallAchievements();
  AutoPlay.handleAscend();
};
const previousHarvesting = AutoPlay.harvesting;
AutoPlay.harvesting = function(garden) {
  for (let y = 0; y < 6; y++) for (let x = 0; x < 6; x++) {
    if (!garden.isTileUnlocked(x, y)) continue;
    const tile = garden.getTile(x, y), plant = tile[0] ? garden.plantsById[tile[0] - 1] : null;
    if (plant?.key === 'queenbeetLump' && tile[1] >= plant.mature) garden.harvest(x, y);
  }
  previousHarvesting(garden);
};
AutoPlay.switchSoil = function(garden, sector, name) {
  if (sector || garden.freeze || garden.nextSoil > Date.now()) return;
  const soil = garden.soils[name];
  if (!soil || garden.soil === soil.id || garden.parent.amount < soil.req) return;
  document.getElementById('gardenSoil-' + soil.id)?.click();
};
// Rebuild arrays defensively for additive game updates. Never invent or unlock entries.
AutoPlay.wantedAchievements = AutoPlay.wantedAchievements.filter(id => legitAchievement(Game.AchievementsById[id]));
for (const a of Object.values(Game.AchievementsById)) {
  if (legitAchievement(a) && /Bake <b>|Bake [\d<]/i.test(a.desc || '') && !AutoPlay.wantedAchievements.includes(a.id)) {
    AutoPlay.wantedAchievements.splice(Math.max(3, AutoPlay.wantedAchievements.length - 3), 0, a.id);
  }
}

return AutoPlay;
};
})(globalThis);
