# Roulette Bot

It's based on my previous repo [Blackjack Online Bot](https://github.com/goodbyte/online-blackjack-bot), but in this case accessing the game's DOM was not possible, so I had to pull a frankenstein, use puppeteer to take screenshots, pass them through an OCR library, use timers... it's not pretty, but it worked.

## Instructions

First you'll need to create a Chrome shortcut with the following command line arguments:

```
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=%TEMP%/puppet
```

Now open Chrome from that shortcut and go to `http://localhost:9222/json/version`, copy the `webSocketDebuggerUrl` value.
With that you've everything you'll need to control that chrome instance remotely.

Now go to the [casino page](https://www.gamingclub.com/es/), log in, open the [roulette game](https://secure.gamingclub.com/premium/game-launch/10076/demo), with the game ready, execute the node program:

```
node index.js
```

It will ask you for the webSocketDebuggerUrl to connect to, follow the instructions, once the injection is completed, draw the capture/click regions for the required elements, once that's done, select the lowest chip (1/4), and from the stats page that just opened, hit play.

[Here, a video step by step](https://youtu.be/I0oOGlaQes4)

## License

MIT