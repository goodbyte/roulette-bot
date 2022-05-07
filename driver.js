const sharp = require('sharp');
const sizeOf = require('buffer-image-size');
const {sleep, random} = require('./utils');
const OCR = require('./ocr');

class Driver {
  static validateActions(actions) {
    const requiredElements = [
      'balance',
      'betAmount',
      // 'currentChip',
      // 'chipUp',
      // 'chipDown',
      'play',
      'double',
      'clear',
      'odd',
    ];
    const requiredProps = [
      'x',
      'y',
      'width',
      'height'
    ];

    return requiredElements.every((key) => {
      const hasKey = key in actions;
      const hasProps = requiredProps.every((prop) => {
        const hasProp = prop in actions[key];
        return hasProp && !Number.isNaN(Number(actions[key][prop]))
      });

      return hasKey && hasProps;
    });
  }

  constructor(page, actions) {
    this.page = page;
    this.actions = actions;
  }

  async _click(region) {
    let {x, y, width, height} = this.actions[region];

    x = x + random(width);
    y = y + random(height);

    const delay = 50 + random(30);

    console.log(`click [${region}]`);
    await this.page.mouse.click(x, y, {delay});
    await sleep(200 + random(200));
  }

  async _ocr(region) {
    const {x, y, width, height} = this.actions[region];

    // const path = `./public/images/ocr/${Date.now()}.png`;
    let buffer = await this.page.screenshot({
      // path,
      clip: {x, y, width, height},
    });

    const dimensions = sizeOf(buffer);

    buffer = await sharp(buffer)
      .resize(dimensions.width * 2, dimensions.height * 2)
      .toBuffer();

    const text = await OCR.getText(buffer);
    const formatted = text.replace(',', '');

    const result = Number(formatted);

    if (Number.isNaN(result)) {
      throw new Error(`ocr [${region}] returned an invalid number. "${text}"`);
    }

    console.log(`ocr [${region}] = ${result}`);

    return result;
  }

  getBalance() {
    return this._ocr('balance');
  }

  getBetAmount() {
    return this._ocr('betAmount');
  }

  // getCurrentChip() {
  //   return this._ocr('currentChip');
  // }

  // clickChipDown() {
  //   return this._click('chipDown');
  // }

  // clickChipUp() {
  //   return this._click('chipUp');
  // }

  clickPlay() {
    return this._click('play');
  }

  clickDouble() {
    return this._click('double');
  }

  clickClear() {
    return this._click('clear');
  }

  clickOdd() {
    return this._click('odd');
  }
}

module.exports = Driver;