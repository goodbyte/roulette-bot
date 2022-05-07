const {EventEmitter} = require('events');
const {sleep} = require('./utils');

class Player extends EventEmitter {
  isPlaying = false;
  betAmount = 0;
  initialBalance = 0;
  currentBalance = 0;
  lowestBalance = 0;
  highestBalance = 0;
  playNumber = 0;
  wins = 0;
  losses = 0;
  playChart = [];
  lossStreak = 0;
  winStreak = 0;
  lossStreakRecord = 0;
  winStreakRecord = 0;
  streakLogs = {
    win: [],
    loss: [],
  };

  constructor(driver) {
    super();

    this._driver = driver;

    const proxy = new Proxy(this, {
      set(target, property, value) {
        target.emit('propertyChanged', {property, value});
        target[property] = value;
        return true;
      },
    });

    return proxy;
  }

  async getBalance() {
    this.currentBalance = await this._driver.getBalance();

    if (this.currentBalance < this.lowestBalance) {
      this.lowestBalance = this.currentBalance;
    } else if (this.currentBalance > this.highestBalance) {
      this.highestBalance = this.currentBalance;
    }

    return this.currentBalance;
  }

  streakLogging(streakType) {
    const streakName = streakType === 'win' ? 'winStreak' : 'lossStreak';
    const streakNumber = this[streakName];

    if (streakNumber > 0) {
      if (this.streakLogs[streakType][streakNumber] == undefined) {
        this.streakLogs[streakType][streakNumber] = {
          count: 0,
          position: [],
        };
      }

      const streakLog = this.streakLogs[streakType][streakNumber];
      streakLog.count++;
      streakLog.position.push({
        start: this.playNumber - streakNumber - 1,
        end: this.playNumber - 1,
      });

      this.emit('propertyChanged', {
        property: 'streakLogs',
        value: this.streakLogs,
      });

      this[streakName] = 0;
    }
  }

  addWin() {
    this.wins++;
    this.winStreak++;

    this.streakLogging('loss');

    if (this.winStreak > this.winStreakRecord) {
      this.winStreakRecord = this.winStreak;
    }
  }

  addLose() {
    this.losses++;
    this.lossStreak++;

    this.streakLogging('win');

    if (this.lossStreak > this.lossStreakRecord) {
      this.lossStreakRecord = this.lossStreak;
    }
  }

  async init() {
    this.initialBalance = await this._driver.getBalance();
    this.currentBalance = this.lowestBalance = this.highestBalance = this.initialBalance;
  }

  start() {
    this.isPlaying = true;
    this.play();
  }

  stop() {
    this.isPlaying = false;
  }

  toggle() {
    this.isPlaying ? this.stop() : this.start();
  }

  async play() {
    const balance = await this.getBalance();
    let displayedBet = await this._driver.getBetAmount();

    if (this.lossStreak > 1 && this.lossStreak < 11) {
      await this._driver.clickDouble();
      this.betAmount = displayedBet * 2;
    } else {
      if (displayedBet !== 0.25) {
        await this._driver.clickClear();
        await this._driver.clickOdd();
      }
      this.betAmount = 0.25;
    }

    await this._driver.clickPlay();

    await sleep(5000);

    const newBalance = await this.getBalance();

    this.playNumber++;
    if (newBalance > balance) this.addWin();
    else this.addLose();

    const playObj = {
      x: this.playNumber.toString(),
      balance: newBalance - this.initialBalance,
    };

    this.playChart.push(playObj);
    this.emit('elementPushed', {arrayName: 'playChart', element: playObj});

    if (this.isPlaying) setTimeout(this.play.bind(this));
  }
}

module.exports = Player;