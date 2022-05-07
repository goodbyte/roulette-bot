import './dom';
import Region from './region';

let selectedAction = null;

const doneButtonEl = document.querySelector('#done');
doneButtonEl.addEventListener('click', () => {
  window.designReady = true;
});

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

const actions = new Proxy({}, {
  set(target, key, value) {
    target[key] = value;
    saveToDB();
    checkDone();
    renderElements();
    return true;
  },
  deleteProperty(target, key) {
    if (!(key in target)) return false;

    target[key].remove();
    delete target[key];
    saveToDB();
    checkDone();
    renderElements();
    return true;
  },
});

createRegionsFromDB();
renderElements();

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && selectedAction) clearSelectedAction();
});

function createRegionsFromDB() {
  try {
    const actionsStr = localStorage.getItem('actions');
    if (!actionsStr) return;

    const storedActions = JSON.parse(actionsStr);
    Object.keys(storedActions)
      .forEach((name) => {
        const {x, y, width, height} = storedActions[name];

        const region = new Region({name, x, y, width, height});
        region.on('dataChanged', saveToDB);
        actions[name] = region;
      });
  } catch (err) {
    alert('stored actions are corrupted');
    localStorage.removeItem('actions');
  }
}

function renderElements() {
  document.querySelector('#elements').innerHTML = requiredElements
    .map((elementName) => {
      const exists = elementName in actions;

      return `
      <li class="flex space-between" style="color: ${exists ? 'green' : 'red'}">
        <span>${elementName}</span>
        <div>
          <button onclick="setAction(event, '${elementName}')">SET</button>
          <button onclick="clearAction('${elementName}')")>X</button>
        </div>
      </li>`
    })
    .join('');
}

function saveToDB() {
  const data = Object.fromEntries(
    Object.entries(actions).map(([key, obj]) => [key, obj.data])
  );
  localStorage.setItem('actions', JSON.stringify(data));
}

function checkDone() {
  const done = requiredElements.every((element) => element in actions);

  if (done) doneButtonEl.removeAttribute('disabled');
  else doneButtonEl.setAttribute('disabled', true);
}

function clearSelectedAction() {
  if (selectedAction) {
    selectedAction.detach();
    selectedAction.remove();
    selectedAction.targetEl.classList.remove('active');
    selectedAction = null;
  }
}

window.setAction = function(e, name) {
  clearSelectedAction();

  selectedAction = new Region();
  selectedAction.attach();
  selectedAction.on('dataChanged', saveToDB);
  selectedAction.on('created', () => {
    if (actions[name]) {
      delete actions[name];
    }

    selectedAction.name = name;
    actions[name] = selectedAction;
    selectedAction = null;
    e.target.classList.remove('active');
  });

  e.target.classList.add('active');
  selectedAction.targetEl = e.target;
  e.stopPropagation();
};

window.clearAction = function(name) {
  delete actions[name];
};