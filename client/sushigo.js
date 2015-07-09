var cards = [];
var numPlayers = 5;
var players = [];
var playerNames = ["Sarah", "Alice", "Bob", "Charlie", "Dan"];
var cardsPerPlayer = 0;
var scores = new ReactiveArray([0, 0, 0, 0, 0]);
Session.setDefault("gameInProgress", false);
Session.setDefault("round", 1);
Session.setDefault("turn", 1);
Session.setDefault("round1Winners", false);
Session.setDefault("round2Winners", false);
Session.setDefault("round3Winners", false);
Session.setDefault("playerName", "Sarah");
Session.setDefault("timer", 7);
Session.setDefault("usingChopsticks", false);
Session.setDefault("puddingCount", 0);
Session.setDefault("roundEnded", false);
Session.setDefault("gameEnded", false);
Session.setDefault("game", 1);
var interval = Meteor.setInterval(timer, 1000);

Template.body.helpers({
  gameInProgress: function () {
    return Session.get("gameInProgress");
  }
});

Template.body.events({
  "click #instructions": function () {
    window.open("http://www.gamewright.com/gamewright/pdfs/Rules/SushiGoTM-RULES.pdf", "_blank");
  }
})

Template.landing.events({
  "click #start-game": function () {
    Session.set("round", 1);
    
    numPlayers = $("#get-num-players").val();
    dealCards();
    Session.set("gameInProgress", true);
    Session.set("playerName", $("#player-name").val());
    return false;
  }
});

Template.game.helpers({
  round: function () {
    return Session.get("round");
  },
  
  players: function () {
    return players;
  }
});

Template.game.events({
  "click #end-game": function () {
    players = [];
    Session.set("gameInProgress", false);
  }  
});

Template.bot.helpers({
  size: function () {
    return 12/(numPlayers-1);
  },
  
  botsChosen: function () {
    return this.chosen.list();
  },
  
  botName: function () {
    return playerNames[this.$index];
  },
  
  score: function () {
    return scores.list()[this.$index];
  }
});

Template.self.helpers({
  myChosen: function () {
    return players[0].chosen.list();
  },
  
  myHands: function () {
    return players[0].hands.list();
  },
  
  score: function () {
    return scores.list()[0];
  },
  
  timer: function () {
    return Session.get("timer");
  },
  
  usingChopsticks: function () {
    return Session.get("usingChopsticks");
  },
  
  puddings: function () {
    return Session.get("puddingCount");
  },
  
  roundEnded: function () {
    return Session.get("roundEnded");
  },
  
  gameEnded: function () {
    return Session.get("gameEnded");
  }
});

Template.self.events({
  "click .choice": function (event) {
    var choice = event.target.dataset.choice;
    
    if (Session.get("usingChopsticks") == true) {
      sushiGo(choice);
      Session.set("usingChopsticks", false);
    } else {
      chooseCard(choice);

      if (players[0].hands.length > 0) {
        Session.set("timer", 7);
      } else {
        calculateScore();
        Session.set("roundEnded", true);
        if (Session.get("round") == 3) {
          Session.set("gameEnded", true);
        }
      }
    }
  },
  
  "click #use-chopsticks": function () {
    Session.set("usingChopsticks", true);
    $("#use-chopsticks").attr("disabled", "disabled");  // enable use chopsticks button
  },
  
  "click #start-round": function () {
    if(Session.get("gameEnded")) {
      Session.set("round", 1);
    } else {
      Session.set("round", Session.get("round")+1);
    }
    
    dealCards();    
    Session.set("roundEnded", false);
  }
});

Template.stats.helpers({
  round: function () {
    return Session.get("round");
  },
  
  turn: function() {
    return Session.get("turn");
  },
  
  round1Winners: function () {
    var round1Winners = Session.get("round1Winners");
    return round1Winners;    
  },
  
  round2Winners: function () {
    var round2Winners = Session.get("round2Winners");
    return round2Winners;    
  },
  
  round3Winners: function () {
    return Session.get("round3Winners");  
  },
  
  game: function () {
    return Session.get("game");
  }
})

/*************
  Game setup
**************/

// Creates the sushigo deck and stores it in cards[]
// Called at the start of round 1 by dealCards()
function initDeck () {
  var counter = 0;
  
  // 14x tempura
  for(var i = 0; i < 14; i++, counter++) {
    cards[counter] = "tempura";
  }
  // 14x Sashimi
  for(var i = 0; i < 14; i++, counter++) {
    cards[counter] = "sashimi";
  }  
  // 14x Dumpling
  for(var i = 0; i < 14; i++, counter++) {
    cards[counter] = "dumpling";
  }
  //12x 2 Maki rolls
  for(var i = 0; i < 12; i++, counter++) {
    cards[counter] = "maki_2";
  }
  // 8x 3 Maki rolls
  for(var i = 0; i < 8; i++, counter++) {
    cards[counter] = "maki_3";
  }
  // 6x 1 Maki roll
  for(var i = 0; i < 6; i++, counter++) {
    cards[counter] = "maki_1";
  }
  // 10x Salmon Nigiri
  for(var i = 0; i < 10; i++, counter++) {
    cards[counter] = "nigiri_salmon";
  }
  // 5x Squid Nigiri
  for(var i = 0; i < 5; i++, counter++) {
    cards[counter] = "nigiri_squid";
  }
  // 5x Egg Nigiri
  for(var i = 0; i < 5; i++, counter++) {
    cards[counter] = "nigiri_egg";
  }
  // 10x Pudding
  for(var i = 0; i < 10; i++, counter++) {
    cards[counter] = "pudding";
  }
  // 6x Wasabi
  for(var i = 0; i < 6; i++, counter++) {
    cards[counter] = "wasabi";
  }
  // 4x Chopsticks
  for(var i = 0; i < 4; i++, counter++) {
    cards[counter] = "chopsticks";
  }
}

// Creates the players array which contains their cards, score, maki count and pudding count
// Called at the start of round 1 by dealCards()
function initPlayers () {  
  if (players.length == 0) {
    for(var i = 0; i < numPlayers; i++) {
      players[i] = {
        chosen : new ReactiveArray(),   // cards which have been selected by the players
        hands : new ReactiveArray(),    // cards which are being passed around
        chopsticks : [],  // record indices of the chopsticks cards in chosen pile for easy removal
        score : 0,
        maki : 0,
        pudding : 0
      };
    }
  } else {
    for(var i = 0; i < numPlayers; i++) {
      players[i].chosen.clear();
      players[i].hands.clear();
      players[i].chopsticks = [];
      players[i].maki = 0;
      players[i].pudding = 0;
    }
  }    
}

// Returns the number of cards each player should get
// Called at the start of round 1 by dealCards()
function calcCardsPerPlayer () {
  switch (parseInt(numPlayers)) {
    case 5:
      return 7;
    case 4:
      return 8;
    case 3:
      return 9;
    case 2:
      return 10;
    default:
      // throw some error
  }
}

// Resets the maki and cards count for each player
// Called at the start of round 2 / 3 by dealCards()
function resetPlayers () {
  for(var i = 0; i < numPlayers; i++) {
    players[i].chosen.clear();
    players[i].maki = 0;
    players[i].chopsticks = [];
  }
}

// Randomly deals cards from cards[] to players
function dealCards () {
  if (Session.get("round") == 1) {
    initDeck();    
    initPlayers(numPlayers);
    cardsPerPlayer = calcCardsPerPlayer(numPlayers);
    
    Session.set("round1Winners", false);
    Session.set("round2Winners", false);
    Session.set("round3Winners", false);
    Session.set("timer", 7);
    Session.set("usingChopsticks", false);
    Session.set("puddingCount", 0);
  } else {
    resetPlayers(numPlayers);
  }  
  
  for(var i = 0; i < cardsPerPlayer; i++) {
    var index;
    for (var j = 0; j < numPlayers; j++) {
      index = rand(0, cards.length);
      players[j].hands.push(cards[index]);
      cards.splice(index, 1);
    }
  }
  
  Session.set("turn", 1);
  $("#use-chopsticks").attr("disabled", "disabled");  // disable use chopsticks button
}


/****************
  Playing rules
*****************/

// Player (rep by players[0]) chooses a card, while AI randomly selects a card
function chooseCard(cardIndex) {
  for(var i = 0; i < numPlayers; i++) {
    // Naive implementation: 66% chance of using chopsticks if bot has it
    if(i != 0 && players[i].chopsticks.length > 0 && rand(0, 3)) { 
      var card = rand(0, players[i].hands.length);
      useChopsticks(i, card);
    }
    
    // Get selected card
    if(i == 0) {
      var chosenCardIndex = cardIndex;
    } else {
      var chosenCardIndex = rand(0, players[i].hands.length);
    }
    var chosenCard = players[i].hands[chosenCardIndex];
    
    // Handle chopsticks card
    if(chosenCard == "chopsticks") {                // Store index of chopsticks card. Not length-1
      players[i].chopsticks.push(players[i].chosen.length); // cos it hasn't been pushed yet.
    } else if (i == 0 && chosenCard == "pudding") {
      Session.set("puddingCount", Session.get("puddingCount")+1);
    }
    
    // Remove chosen card from deck
    players[i].chosen.push(chosenCard);
    players[i].hands.splice(chosenCardIndex, 1);
    //console.log("Player " + i + " has chosen " + chosenCard + " (index: " + chosenCardIndex + ")");
  }
  
  if (players[0].hands.length > 0) {
    passCards();
  }  
}

// Pass on cards to next player, take cards from previous player
function passCards() {
  var prevHand = players[numPlayers-1].hands;
  for(var i = 0;  i < numPlayers; i++) {
    var tempHand = players[i].hands;
    players[i].hands = prevHand;
    prevHand = tempHand;
  }
  
  if(players[0].chopsticks.length > 0) {
    $("#use-chopsticks").removeAttr("disabled");  // enable use chopsticks button
  }
  Session.set("turn", Session.get("turn") + 1);
}

// For the player to manually call before chooseCard
function sushiGo(card) {
  useChopsticks(0, card);
}

// Actual usage of chopsticks card
function useChopsticks(player, cardIndex) {
  console.log('Player ' + player + ': "Sushi Go!"');
  var chosenCard = players[player].hands[cardIndex];
  
  // Remove chosen card from hands and put it in chosen card arr
  players[player].chosen.push(chosenCard);
  players[player].hands.splice(cardIndex, 1);
  console.log("Player " + player + " has chosen " + chosenCard + " using chopsticks (index: " + cardIndex + ")");

  // Put chopsticks back into hands and remove from chosen cards
  // Always remove the first elem of chopsticks arr since it's guaranteed to be there
  players[player].hands.push("chopsticks");
  players[player].chosen.splice(players[player].chopsticks[0], 1);
  players[player].chopsticks.splice(0, 1);
}

/****************
  Scoring rules
*****************/

// Calculate score for all players and returns the player with the highest points
function calculateScore () {
  var round = Session.get("round");
  
  // For calculating maki score
  var maxMaki = 0;
  var maxMakiPlayers = [];
  var nextMaki = 0;
  var nextMakiPlayers = [];

  // For calculating pudding score
  if (round == 3) {
    var maxPudding = 0;
    var maxPuddingPlayers = [];
    var minPudding = 10;
    var minPuddingPlayers = [];
  }  
  
  for(var i = 0; i < numPlayers; i++) {
    var tempuraCount = 0;
    var sashimiCount = 0;
    var dumplingCount = 0;
    var wasabiCount = 0;
    var squidCount = 0;
    var salmonCount = 0;
    var eggCount = 0;
    
    // Count the cards
    for(var j = 0; j < players[i].chosen.length; j++) {
      switch(players[i].chosen[j]) {
        case "tempura":
          tempuraCount++;
          break;
          
        case "sashimi":
          sashimiCount++;
          break;
          
        case "dumpling":
          dumplingCount++;
          break;
          
        case "wasabi":
          wasabiCount++;
          break;
          
        case "nigiri_squid":
          if(wasabiCount == 0) {
            squidCount++;
          } else {
            squidCount += 3;
            wasabiCount--;
          }
          break;
          
        case "nigiri_salmon":
          if(wasabiCount == 0) {
            salmonCount++;
          } else {
            salmonCount += 3;
            wasabiCount--;
          }
          break;
          
        case "nigiri_egg":
          if(wasabiCount == 0) {
            eggCount++;
          } else {
            eggCount += 3;
            wasabiCount--;
          }
          break;
          
        case "maki_1":
          players[i].maki++;
          break;
          
        case "maki_2":
          players[i].maki += 2;
          break;
          
        case "maki_3":
          players[i].maki += 3;
          break;
          
        case "pudding":
          players[i].pudding++;
          break;
      }    
    }
    
    // Calculate the scores for all cards except maki and pudding
    var tempuraScore = Math.floor(tempuraCount / 2) * 5;
    var sashimiScore = Math.floor(sashimiCount / 3) * 10;
    switch(dumplingCount) {
      case 0:
        var dumplingScore = 0;
        break;
      case 1:
        var dumplingScore = 1;
        break;
      case 2:
        var dumplingScore = 3;
        break;
      case 3:
        var dumplingScore = 6;
        break;
      case 4:
        var dumplingScore = 10;
        break;
      default:
        var dumplingScore = 15;
    }
    var squidScore = squidCount * 3;
    var salmonScore = salmonCount * 2;
    var eggScore = eggCount;
    
    //console.log("player", i, tempuraScore, sashimiScore, dumplingScore, squidScore, salmonScore, eggScore);
    
    // Get players with max and second highest maki cards    
    if (players[i].maki > maxMaki) {
      nextMaki = maxMaki;
      nextMakiPlayers = maxMakiPlayers;
      maxMaki = players[i].maki;
      maxMakiPlayers = [i];
    } else if (players[i].maki == maxMaki) {
      maxMakiPlayers.push(i);

    } else if (players[i].maki > nextMaki) {
      nextMaki = players[i].maki;
      nextMakiPlayers = [i];
    } else if (players[i].maki == nextMaki) {
      nextMakiPlayers.push(i);
    }
    
    // Get players with max and min pudding cards ONLY on the last round (round 3)
    if (round == 3) {
      // get players who have the max number of puddings
      if (players[i].pudding > maxPudding) {
        maxPudding = players[i].pudding;
        maxPuddingPlayers = [i];
      } else if (players[i].pudding == maxPudding) {
        maxPuddingPlayers.push(i);
      }
      
      // get players who have the min number of puddings only if there are more than 2 players
      if (numPlayers > 2) {
        if (players[i].pudding < minPudding) {
          minPudding = players[i].pudding;
          minPuddingPlayers = [i];
        } else if (players[i].pudding == minPudding) {
          minPuddingPlayers.push(i);
        }
      }
    }
    
    players[i].score += tempuraScore + sashimiScore + dumplingScore 
                        + squidScore + salmonScore + eggScore;
  }
  
  // Calculate the maki score. If there's a tie for max, DON'T award points
  // to the player with the next highest num of maki cards
  if(maxMakiPlayers.length > 1) {
    splitPoints (6, maxMakiPlayers);
  } else {
    players[maxMakiPlayers[0]].score += 6;
    splitPoints (3, nextMakiPlayers);
  }
  
  // Calculate the pudding score ONLY on the last round (round 3),
  //  and if NOT everybody has the same number of pudding cards
  if (round == 3 && maxPuddingPlayers.length != numPlayers) {
    // for max pudding
    console.log("maxPuddingPlayers: " + maxPuddingPlayers);
    splitPoints (6, maxPuddingPlayers);
    
    // for min pudding only if there are more than 2 players
    if(numPlayers > 2) {
      splitPoints (-6, minPuddingPlayers);
    }    
  }
  
  scores.clear();
  for (var i = 0; i < players.length; i++) {
    scores.push(players[i].score);
  }
  
  findWinner();
}

// For calculating maki and pudding scores which may require splitting of points
// Called by calculateScore()
function splitPoints (maxPoints, playersToSplit) {
  if(maxPoints > 0) {
    var score = Math.floor(maxPoints / playersToSplit.length);
  } else {
    var score = Math.ceil(maxPoints / playersToSplit.length);
  }
  for(var i = 0; i < playersToSplit.length; i++) {
    players[playersToSplit[i]].score += score;
  }  
}

// Returns the player(s) with the highest points
// Called by calculateScore()
function findWinner () {
  var round = Session.get("round");
  var maxScore = 0;
  var maxScorePlayers = [];
  var winners = [];
  
  for(var i = 0; i < numPlayers; i++) {
    if (players[i].score > maxScore) {
      maxScore = players[i].score;
      maxScorePlayers = [];
      maxScorePlayers.push(i);
    } else if (players[i].score == maxScore) {
      maxScorePlayers.push(i);
    }
  }
  
  if(round == 3) {
    switch (maxScorePlayers.length) {
      case 1:
        winners = maxScorePlayers;
        break;
      
      case 2:
        if (players[maxScorePlayers[0]].pudding > players[maxScorePlayers[1]].pudding) {
          winners = [maxScorePlayers[0]];
        } else {
          winners = [maxScorePlayers[1]];
        }
        break;
        
      default:
        var maxPudding = 0;
        var maxPuddingPlayers = [];      
        for(var i = 0; i < maxScorePlayers.length; i++) {   
          if (players[maxScorePlayers[i]].pudding > maxPudding) {
            maxPudding = players[maxScorePlayers[i]].pudding;
            maxPuddingPlayers = [];
            maxPuddingPlayers.push(maxScorePlayers[i]);
          } else if (players[maxScorePlayers[i]].pudding == maxPudding) {
            maxPuddingPlayers.push(maxScorePlayers[i]);
          }
        }
        winners = maxPuddingPlayers;
    }
  } else {
    winners = maxScorePlayers;
  }
  
  getWinnersName(winners);
}

function getWinnersName(winners) {  
  // Get winner names
  var winnerNames = "";
  switch (winners.length) {
    case 0:
      winnerNames = false;
      break;
    case 1:
      winnerNames = playerNames[winners[0]];
      break;
    default:
      for(var i = 0; i < winners.length; i++) {
        if(i != 0) {
          winnerNames += ", ";
        }
        winnerNames += playerNames[winners[i]];
      }
  }
  
  // Get round number
  var roundWinners;
  switch (Session.get("round")) {
    case 1:
      roundWinners = "round1Winners";
      break;
    case 2:
      roundWinners = "round2Winners";
      break;
    case 3:
      roundWinners = "round3Winners";
      break;
  }
  Session.set(roundWinners, winnerNames);
}


/*******************
  Helper functions
********************/

// Returns a random integer between min (included) and max (excluded)
function rand (min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

// Countdown timer
function timer () {
  if(players.length > 0) {
    var count = Session.get("timer");
    if (count > 0) {
      count--;
      Session.set("timer", count);
    } else {
      if (players[0].hands.length > 0) {
        chooseCard(rand(0, players[0].hands.length));
      }
      
      if (players[0].hands.length > 0) {      
        Session.set("timer", 7);
      } else {
        Session.set("roundEnded", true);
      }
    }
  }  
}

