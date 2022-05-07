import Emitter from './emitter';

class Region extends Emitter {
  constructor(opts) {
    super();

    let debounceHnd;

    this.attached = false;
    this.type = 'region';

    this.data = new Proxy({}, {
      set: (target, key, value) => {
        target[key] = value;
        if (debounceHnd) clearTimeout(debounceHnd);
        debounceHnd = setTimeout(() => {
          this.emit('dataChanged');
        }, 10);
        return true;
      },
    });

    this.containerEl = document.createElement('div');
    this.containerEl.classList.add('inject-action');

    this.contentEl = document.createElement('div');
    this.contentEl.style.position = 'relative';

    this.regionEl = document.createElement('div');
    this.regionEl.classList.add(this.type);

    this.resizeEl = document.createElement('div');
    this.resizeEl.classList.add('resize');

    this.titleEl = document.createElement('p');
    this.titleEl.classList.add('title');

    this.contentEl.appendChild(this.resizeEl);
    this.containerEl.append(this.contentEl, this.titleEl);

    if (typeof opts === 'object') {
      const requiredOpts = ['name', 'x', 'y', 'width', 'height'];
      const notValid = !requiredOpts.every((key) => key in opts);

      if (notValid) throw new Error('missing parameters while creating new region');

      const {name, x, y, width, height} = opts;
      this.data = Object.assign(this.data, {x, y, width, height});

      this.regionEl.style.width = `${width}px`;
      this.regionEl.style.height = `${height}px`;

      this.name = name;

      this.setup();
    } else {
      this.setupCreationMode();
    }
  }

  setupCreationMode() {
    let initialX, initialY;

    this.isMouseDown = false;

    const onpointerdown = (e) => {
      this.isMouseDown = true;

      initialX = e.pageX;
      initialY = e.pageY;

      this.regionEl.style.left = `${initialX}px`;
      this.regionEl.style.top = `${initialY}px`;

      document.body.appendChild(this.regionEl);
    };

    const onpointermove = (e) => {
      if (!this.isMouseDown) return;

      const isXNegative = e.pageX < initialX;
      const isYNegative = e.pageY < initialY;

      const width = Math.abs(e.pageX - initialX);
      const height = Math.abs(e.pageY - initialY);

      this.regionEl.style.left = `${isXNegative ? e.pageX : initialX}px`;
      this.regionEl.style.top =  `${isYNegative ? e.pageY : initialY}px`;

      this.regionEl.style.width = `${width}px`;
      this.regionEl.style.height = `${height}px`;
    };

    const onpointerup = () => {
      if (!this.isMouseDown) return;

      this.isMouseDown = false;

      let {x, y, width, height} = this.regionEl.getBoundingClientRect();
      x += window.scrollX;
      y += window.scrollY;

      this.data = Object.assign(this.data, {x, y, width, height});

      this.regionEl.style.position = '';
      this.regionEl.style.left = '';
      this.regionEl.style.top = '';

      this.detach();
      this.setup();
    }

    this.events = [
      {name: 'pointerdown', handler: onpointerdown},
      {name: 'pointermove', handler: onpointermove},
      {name: 'pointerup', handler: onpointerup},
    ];

    this.regionEl.style.position = 'absolute';
  }

  set name(val) {
    this.titleEl.innerText = val;
  }

  remove() {
    if (document.body.contains(this.containerEl)) {
      document.body.removeChild(this.containerEl);
    }
    if (document.body.contains(this.regionEl)) {
      document.body.removeChild(this.regionEl);
    }
  }

  attach() {
    if (this.attached) return;

    document.body.style.cursor = 'crosshair';

    this.events.forEach((e) => document.body.addEventListener(e.name, e.handler));
    this.attached = true;
  }

  detach() {
    if (!this.attached) return;

    document.body.style.cursor = '';

    this.events.forEach((e) => document.body.removeEventListener(e.name, e.handler));
    this.attached = false;
  }

  setup() {
    this.contentEl.insertBefore(this.regionEl, this.resizeEl);

    document.body.appendChild(this.containerEl);

    requestAnimationFrame(() => {
      const {x: containerX, y: containerY} = this.containerEl.getBoundingClientRect();
      const {x: regionX, y: regionY} = this.regionEl.getBoundingClientRect();

      const left = this.data.x - (regionX - containerX);
      const top = this.data.y - (regionY - containerY);

      this.containerEl.style.left = `${left}px`;
      this.containerEl.style.top = `${top}px`;
    });

    this.moveable();
    this.resizable();

    this.emit('created');
  }

  moveable() {
    let moving = false;
    let offsetX, offsetY;

    this.regionEl.style.cursor = 'move';

    this.regionEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;

      moving = true;
      this.titleEl.style.visibility = 'hidden';
      ({offsetX, offsetY} = e);
    });

    document.body.addEventListener('pointermove', (e) => {
      if (!moving) return;

      const {x: containerX, y: containerY} = this.containerEl.getBoundingClientRect();
      const {x: regionX, y: regionY} = this.regionEl.getBoundingClientRect();

      const left = e.pageX - ((regionX - containerX) + offsetX);
      const top = e.pageY - ((regionY - containerY) + offsetY);

      this.containerEl.style.left = `${left}px`;
      this.containerEl.style.top = `${top}px`;
    });

    document.body.addEventListener('pointerup', (e) => {
      if (!moving) return;

      let {x, y} = this.regionEl.getBoundingClientRect();
      x += window.scrollX;
      y += window.scrollY;

      this.data = Object.assign(this.data, {x, y});
      this.titleEl.style.visibility = '';

      moving = false;
    });
  }

  resizable() {
    let isResizing = false;

    this.resizeEl.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();

      isResizing = true;

      let {left, top} = this.regionEl.getBoundingClientRect();
      left += window.scrollX;
      top += window.scrollY;

      this.titleEl.style.visibility = 'hidden';
      this.containerEl.style.alignItems = 'flex-start';

      this.containerEl.style.left = `${left}px`;
      this.containerEl.style.top = `${top}px`;
    });

    document.body.addEventListener('pointermove', (e) => {
      if (!isResizing) return;

      let {left, top} = this.regionEl.getBoundingClientRect();
      left += window.scrollX;
      top += window.scrollY;

      this.regionEl.style.width = `${e.pageX - left}px`;
      this.regionEl.style.height = `${e.pageY - top}px`;
    });

    document.body.addEventListener('pointerup', () => {
      if (!isResizing) return;

      let {x, y, width, height} = this.regionEl.getBoundingClientRect();
      x += window.scrollX;
      y += window.scrollY;
      this.data = Object.assign(this.data, {x, y, width, height});

      this.titleEl.style.visibility = '';
      this.containerEl.style.alignItems = '';

      const {x: containerX, y: containerY} = this.containerEl.getBoundingClientRect();
      const {x: regionX, y: regionY} = this.regionEl.getBoundingClientRect();

      const left = this.data.x - (regionX - containerX);
      const top = this.data.y - (regionY - containerY);

      this.containerEl.style.left = `${left}px`;
      this.containerEl.style.top = `${top}px`;

      isResizing = false;
    });
  }
}

export default Region;