// jsdom setup for DOM APIs used in the app
// Provide minimal globals that scripts expect in the browser

// Stub alert/confirm to avoid blocking in tests
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Provide minimal window properties used by barcode.js
if (!global.window) {
  global.window = global;
}

// Expose jsdom-provided objects on global for vm contexts
if (typeof window !== 'undefined') {
  global.localStorage = window.localStorage;
  global.navigator = window.navigator;
  global.document = window.document;
  global.setTimeout = setTimeout;
  global.clearTimeout = clearTimeout;
}

// ZXing placeholder to avoid ReferenceErrors when code creates BrowserMultiFormatReader
global.window.BrowserMultiFormatReader = class {
  listVideoInputDevices() { return Promise.resolve([{ deviceId: 'test' }]); }
  decodeFromVideoDevice(_id, _video, cb) {
    // allow test to manually trigger cb via instance._emit
    this._cb = cb;
  }
  reset() { /* noop */ }
};

// NotFoundException placeholder used in error handling
global.window.NotFoundException = class NotFoundException {};

// Minimal Konva stubs for floorplan.js imports when required indirectly
global.Konva = {
  Stage: class { constructor(opts){ this._opts=opts; this._scale=1; this._x=0; this._y=0; this._events={}; }
    destroy(){}
    add(){ }
    on(event, handler){ this._events[event]=handler; }
    off(){ }
    container(){ return { getBoundingClientRect: () => ({ left:0, top:0 }) } }
    scale(val){ if (val) { this._scale = val.x; } return { x:this._scale, y:this._scale }; }
    scaleX(){ return this._scale; }
    position(val){ if (val){ this._x=val.x; this._y=val.y; } return { x:this._x, y:this._y }; }
    x(){ return this._x; }
    y(){ return this._y; }
    width(){ return 1000; }
    height(){ return 600; }
    getPointerPosition(){ return { x:0, y:0 }; }
    batchDraw(){}
  },
  Layer: class { constructor(){ this._children=[]; } add(node){ this._children.push(node); } destroyChildren(){ this._children=[]; } find(){ return []; } draw(){} },
  Transformer: class { constructor(){ this._nodes=[]; this._visible=true; }
    nodes(n){ if (n) this._nodes=n; return this._nodes; }
    visible(v){ if (v!==undefined) this._visible=v; return this._visible; }
  },
  Rect: class { constructor(opts){ Object.assign(this, { _x:opts.x,_y:opts.y,_w:opts.width||0,_h:opts.height||0,_fill:opts.fill, draggable:!!opts.draggable }); }
    x(){ return this._x; } y(){ return this._y; } width(v){ if(v!==undefined) this._w=v; return this._w; }
    height(v){ if(v!==undefined) this._h=v; return this._h; } fill(){ return this._fill; } remove(){}
    destroy(){} listenting(){return true;} instanceof(){ return true; }
  },
  Circle: class { constructor(opts){ Object.assign(this, { _x:opts.x,_y:opts.y,_r:opts.radius||0,_fill:opts.fill }); }
    x(){ return this._x; } y(){ return this._y; } radius(v){ if(v!==undefined) this._r=v; return this._r; } fill(){ return this._fill; }
  },
  Text: class { constructor(opts){ Object.assign(this, { _x:opts.x,_y:opts.y,_text:opts.text,_fill:opts.fill }); }
    x(){ return this._x; } y(){ return this._y; } text(v){ if(v!==undefined) this._text=v; return this._text; } fill(){ return this._fill; }
    width(){ return this._text ? this._text.length * 7 : 0; } height(){ return 20; }
  },
  Group: class { constructor(opts){ this._x=opts.x||0; this._y=opts.y||0; this.attrs={ productId: opts.productId }; this._events={}; }
    add(){ } destroy(){} draggable(){ return true; } x(){ return this._x; } y(){ return this._y; }
    on(name, handler){ this._events[name]=handler; } off(){ this._events={}; }
  }
};


