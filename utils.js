function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function random(max) {
  return Math.round((Math.random() * max));
}

module.exports = {
  sleep,
  random,
};