const {createWorker} = require('tesseract.js');

class OCR {
  constructor() {
    this.worker = createWorker();
    this.initialized = this.init();
  }

  async init() {
    await this.worker.load();
    await this.worker.loadLanguage('eng');
    await this.worker.initialize('eng');
    await this.worker.setParameters({
      tessedit_char_whitelist: ',.0123456789',
    });
  }

  async getText(buffer) {
    await this.initialized;
    const {data: {text}} = await this.worker.recognize(buffer);
    return text;
  }
}

module.exports = new OCR();