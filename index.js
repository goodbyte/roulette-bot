const puppeteer =  require('puppeteer-core');
const inquirer = require('inquirer');
const Driver = require('./driver');
const Player = require('./player');
const statsServer = require('./stats-server');

// "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=%TEMP%/puppet

run();

function connect(browserWSEndpoint) {
  return puppeteer
    .connect({
      browserWSEndpoint,
      defaultViewport: null,
    })
    .catch((err) => {
      throw new Error('Could not connect to endpoint');
    });
}

async function parseActions(page, actionsStr) {
  const actions = JSON.parse(actionsStr);

  const isNotValid = !Driver.validateActions(actions);

  if (isNotValid) {
    await page.evaluate(() => localStorage.removeItem('actions'));
    throw new Error('Invalid regions, storage has been cleared');
  }

  return actions;
}

function anyKeyPress(message) {
  console.log(message);
  process.stdin.setRawMode();
  process.stdin.resume();
  return new Promise((resolve) => process.stdin.once('data', resolve));
}

async function injectDesignMode(page) {
  await Promise.all([
    page.addStyleTag({path: './inject/style.css'}),
    page.addScriptTag({path: './inject/script.js'}),
  ]);

  console.log('Injected. Waiting for user to design regions...');

  await page.waitForFunction('window.designReady', {timeout: 0});
}

async function run() {
  // http://localhost:9222/json/version webSocketDebuggerUrl
  const {ws} = await inquirer.prompt([{
    type: 'input',
    name: 'ws',
    message: 'Enter the webSocketDebuggerUrl to connect to:',
  }]);

  const browser = await connect(ws);
  const [page] = await browser.pages();

  console.log('Connected');

  let actionsStr = await page.evaluate(() => localStorage.getItem('actions'));
  let actions, inject;

  if (actionsStr) {
    actions = await parseActions(page, actionsStr);

    ({inject} = await inquirer.prompt([{
      type: 'confirm',
      name: 'inject',
      message: 'Regions found! Do you want to inject design mode anyways?',
      default: false,
    }]));
  } else {
    await anyKeyPress('Press any key when ready to inject design mode');
  }

  if (!actionsStr || inject) {
    await injectDesignMode(page);

    actionsStr = await page.evaluate(() => localStorage.getItem('actions'));
    actions = await parseActions(page, actionsStr);

    console.log('Reloading page...');
    await page.reload({waitUntil: 'networkidle0', timeout: 0});
  }

  await anyKeyPress('Press any key when on game ready state');

  const driver = new Driver(page, actions);
  const player = new Player(driver);

  await player.init();
  statsServer.init(player);

  const statsPage = await browser.newPage();
  const PORT = process.env.PORT || 3000;

  statsPage.goto(`http://localhost:${PORT}`);

  page.bringToFront();
}