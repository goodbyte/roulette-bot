const overlayEl = document.createElement('div');
overlayEl.setAttribute('id', 'inject-overlay');

const designModeDecal = document.createElement('span');
designModeDecal.setAttribute('id', 'design-mode-decal');
designModeDecal.innerText = 'Design Mode';

const tools = document.createElement('div');
tools.setAttribute('id', 'tools');
tools.classList.add('flex-column');

const elementsTitleEl = document.createElement('div');
elementsTitleEl.classList.add('title');
elementsTitleEl.innerText = 'Required elements';

const elementsEl = document.createElement('ul');
elementsEl.setAttribute('id', 'elements');

const doneButtonEl = document.createElement('button');
doneButtonEl.setAttribute('id', 'done');
doneButtonEl.setAttribute('disabled', true);
doneButtonEl.innerText = 'DONE';

tools.append(elementsTitleEl, elementsEl, doneButtonEl);
overlayEl.append(designModeDecal, tools);

document.body.append(overlayEl);