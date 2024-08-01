const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 800,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let deck, playerHand, dealerHand, playerText, dealerText, messageText, hitButton, standButton, resetButton, startButton, gameOver;
let playerCardSprites = [], dealerCardSprites = [], jokeText;

function preload() {
    this.load.image('cardBack', '/assets/images/card_back_red.png');
    this.load.atlasXML('cards', '/assets/images/playingCards.png', '/assets/playingCards.xml'); // Replace with actual paths
}

function create() {
    setBackgroundColorBasedOnState(this);
    this.add.text(config.width / 2, 50, 'Blackjack Game', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
    fetchRandomJoke(this);
    startButton = this.add.text(config.width / 2, 160, 'Start Game', { fontSize: '32px', fill: '#f00' })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => startGame(this));
}

function update() {}

function fetchRandomJoke(scene) {
    fetch('https://v2.jokeapi.dev/joke/Any?type=single')
        .then(response => response.json())
        .then(data => {
            const joke = data.joke;
            jokeText = scene.add.text(config.width / 2, 120, joke, { fontSize: '18px', fill: '#fff', wordWrap: { width: 900 } }).setOrigin(0.5);
        })
        .catch(error => {
            console.error('Error fetching the joke:', error);
        });
}

function createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push({ suit, value });
        }
    }
    return deck;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

function drawCard() {
    return deck.pop();
}

function getCardValue(card) {
    if (card.value === 'A') return 11;
    if (['K', 'Q', 'J'].includes(card.value)) return 10;
    return parseInt(card.value);
}

function getHandValue(hand) {
    let value = hand.reduce((sum, card) => sum + getCardValue(card), 0);
    let aces = hand.filter(card => card.value === 'A').length;
    while (value > 21 && aces > 0) {
        value -= 10;
        aces--;
    }
    return value;
}

function playerHit() {
    if (gameOver) return;
    playerHand.push(drawCard());
    playerText.setText(`Player: ${getHandValue(playerHand)}`);
    if (getHandValue(playerHand) > 21) {
        messageText.setText('Player busts! Dealer wins.');
        gameOver = true;
    }
    displayHand(this, playerHand, 150, 450, 'Player');
}

function playerStand() {
    if (gameOver) return;
    dealerText.setText(`Dealer: ${getHandValue(dealerHand)}`);
    while (getHandValue(dealerHand) < 17) {
        dealerHand.push(drawCard());
        dealerText.setText(`Dealer: ${getHandValue(dealerHand)}`);
        displayHand(this, dealerHand, 150, 200, 'Dealer', false);
    }
    if (getHandValue(dealerHand) > 21) {
        messageText.setText('Dealer busts! Player wins.');
    } else if (getHandValue(dealerHand) >= getHandValue(playerHand)) {
        messageText.setText('Dealer wins.');
    } else {
        messageText.setText('Player wins.');
    }
    gameOver = true;
}

function displayHand(scene, hand, x, y, owner, hideSecondCard = false) {
    if (owner === 'Player') {
        playerCardSprites.forEach(sprite => sprite.destroy());
        playerCardSprites = [];
    } else {
        dealerCardSprites.forEach(sprite => sprite.destroy());
        dealerCardSprites = [];
    }

    hand.forEach((card, index) => {
        let cardImage = hideSecondCard && index > 0 ? 'cardBack' : getCardImageKey(card);
        const sprite = scene.add.image(x + index * 60, y, 'cards', cardImage).setScale(0.5);
        if (owner === 'Player') {
            playerCardSprites.push(sprite);
            // Spin animation for player cards
            scene.tweens.add({
                targets: sprite,
                angle: { from: 0, to: 360 },
                duration: 500,
                ease: 'Cubic.easeOut'
            });
        } else {
            dealerCardSprites.push(sprite);
        }
    });
}

function getCardImageKey(card) {
    const suitMap = {
        'hearts': 'Hearts',
        'diamonds': 'Diamonds',
        'clubs': 'Clubs',
        'spades': 'Spades'
    };
    return `card${suitMap[card.suit]}${card.value}`;
}

function resetGame() {
    gameOver = false;
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = [drawCard(), drawCard()];
    dealerHand = [drawCard(), drawCard()];
    displayHand(this, playerHand, 150, 450, 'Player');
    displayHand(this, dealerHand, 150, 200, 'Dealer', true);
    playerText.setText(`Player: ${getHandValue(playerHand)}`);
    dealerText.setText(`Dealer: ${getHandValue([dealerHand[0]])} + ?`);
    messageText.setText('');
    hitButton.setInteractive();
    standButton.setInteractive();
}

function startGame(scene) {
    if (jokeText) jokeText.destroy();
    initGame(scene);
    startButton.setVisible(false);
    hitButton.setVisible(true);
    standButton.setVisible(true);
    resetButton.setVisible(true);
}

function initGame(scene) {
    deck = createDeck();
    shuffleDeck(deck);
    playerHand = [drawCard(), drawCard()];
    dealerHand = [drawCard(), drawCard()];
    displayHand(scene, playerHand, 150, 450, 'Player');
    displayHand(scene, dealerHand, 150, 200, 'Dealer', true);
    playerText = scene.add.text(150, 550, `Player: ${getHandValue(playerHand)}`, { fontSize: '32px', fill: '#fff' });
    dealerText = scene.add.text(150, 100, `Dealer: ${getHandValue([dealerHand[0]])} + ?`, { fontSize: '32px', fill: '#fff' });
    messageText = scene.add.text(500, 650, '', { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
    hitButton = scene.add.text(800, 450, 'Hit', { fontSize: '32px', fill: '#0f0' })
        .setInteractive()
        .on('pointerdown', playerHit, scene);
    standButton = scene.add.text(800, 500, 'Stand', { fontSize: '32px', fill: '#0f0' })
        .setInteractive()
        .on('pointerdown', playerStand, scene);
    resetButton = scene.add.text(800, 550, 'Reset', { fontSize: '32px', fill: '#f00' })
        .setInteractive()
        .on('pointerdown', resetGame, scene);
    hitButton.setVisible(false);
    standButton.setVisible(false);
    resetButton.setVisible(false);
}

function setBackgroundColorBasedOnState(scene) {
    fetch('https://ipinfo.io/json?token=5f980a14e2b304') // Replace 'your_token_here' with your actual IPInfo token
        .then(response => response.json())
        .then(data => {
            const state = data.region;
            const color = getColorByState(state);
            scene.cameras.main.setBackgroundColor(color);
        })
        .catch(error => {
            console.error('Error fetching location data:', error);
        });
}

function getColorByState(state) {
    const stateColors = {
        'Alabama': '#FF5733',
        'Alaska': '#33C4FF',
        'Arizona': '#FF33FF',
        'Arkansas': '#33FF57',
        'California': '#FFDDC1',
        'Colorado': '#FFD733',
        'Connecticut': '#C1C1FF',
        'Delaware': '#33FFDD',
        'Florida': '#FF33AA',
        'Georgia': '#FFA833',
        'Hawaii': '#33FFA8',
        'Idaho': '#FFA833',
        'Illinois': '#FF5733',
        'Indiana': '#33C4FF',
        'Iowa': '#FF33FF',
        'Kansas': '#33FF57',
        'Kentucky': '#FFDDC1',
        'Louisiana': '#FFD733',
        'Maine': '#C1C1FF',
        'Maryland': '#33FFDD',
        'Massachusetts': '#FF33AA',
        'Michigan': '#FFA833',
        'Minnesota': '#33FFA8',
        'Mississippi': '#FFA833',
        'Missouri': '#FF5733',
        'Montana': '#33C4FF',
        'Nebraska': '#FF33FF',
        'Nevada': '#33FF57',
        'New Hampshire': '#FFDDC1',
        'New Jersey': '#FFD733',
        'New Mexico': '#C1C1FF',
        'New York': '#33FFDD',
        'North Carolina': '#FF33AA',
        'North Dakota': '#FFA833',
        'Ohio': '#33FFA8',
        'Oklahoma': '#FFA833',
        'Oregon': '#FF5733',
        'Pennsylvania': '#33C4FF',
        'Rhode Island': '#FF33FF',
        'South Carolina': '#33FF57',
        'South Dakota': '#FFDDC1',
        'Tennessee': '#FFD733',
        'Texas': '#FFC1C1',
        'Utah': '#C1D1FF',
        'Vermont': '#33FFDD',
        'Virginia': '#FF33AA',
        'Washington': '#FFA833',
        'West Virginia': '#33FFA8',
        'Wisconsin': '#FFA833',
        'Wyoming': '#FF5733',
        'default': '#228B22' // Default green if state is not found
    };
    return stateColors[state] || stateColors['default'];
}
