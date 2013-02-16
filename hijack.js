
/**
 * Module dependencies.
 */

var debug = require('debug')('event-hijack');
var slice = Array.prototype.slice;
var prefix = '_hijack_';

/**
 * Module exports.
 */

module.exports = hijack;

/**
 * Accepts an `EventEmitter` instance and "hijacks" the specified event `name`.
 *
 * Returns a `Function` that, when invoked, will emit a hijacked event of `name`.
 * But future calls to `.on(name, fn)` will actually be *hijacked*, in that only
 * invoking the returned function will invoke the callback, and `.emit(name)` will
 * only work on previously attached listeners for `name`, and will also invoke the
 * optional `fn` callback function provided to this function.
 *
 * @param {EventEmitter} emitter EventEmitter instance to "hijack"
 * @param {String} name event name to "hijack"
 * @param {Function} fn (optional) final callback to attach to `name` before "hijacking"
 * @return {Function} a function that, when invoked, invokes all the "hijacked" listeners for `name`
 * @api public
 */

function hijack (emitter, name, fn) {
  debug('hijacking event %j on emitter', name);

  // monkey-patch the event emitter functions
  setup(emitter);

  // add event listener before hijacking
  if ('function' == typeof fn) {
    emitter._hijackRealAddListener(name, fn);
  }

  // mark that this event has been "hijacked"
  emitter._hijackedEvents[name] = true;

  // define a getter/setter for the `on%name%` handler property.
  // this is used as a shortcut event handler in some parts of node-core.
  var prop = prefix + 'on' + name;
  function get () {
    debug('get(): %s - returning `undefined`', 'on' + name);
    return void(0);
  }
  function set (v) {
    debug('set(): %s %s', 'on' + name, v == null ? 'null' : typeof v);
    var old = this[prop];
    if (old) {
      this.removeListener(name, old.listener);
      this[prop] = null;
    }
    if (v) {
      v.listener = function (buf) {
        if (Buffer.isBuffer(buf)) v.call(this, buf, 0, buf.length); // assume "data" listener
        else v.apply(this, arguments);
      };
      this.on(ev, v.listener);
    }
    return this[prop] = v;
  }
  Object.defineProperty(emitter, 'on' + name, {
    get: get,
    set: set,
    enumerable: true,
    configurable: true
  });

  // the returned function is how you invoke the "hijacked" event listeners
  var ev = prefix + name;
  return function emit () {
    debug('emitting hijacked %j event (%j)', name, ev);
    var args = slice.call(arguments);
    args.unshift(ev);
    return emitter.emit.apply(emitter, args);
  };
}

/**
 * Sets up the "hijack" stuff on the specified EventEmitter instance.
 *
 * @api private
 */

function setup (emitter) {
  if (emitter._hijacked) return;
  debug('setup()');

  // map of names of events that have been hijacked
  emitter._hijackedEvents = {};

  // original EventEmitter functions for later
  emitter._hijackRealAddListener = emitter.addListener;
  emitter._hijackRealRemoveListener = emitter.removeListener;
  emitter._hijackRealOnce = emitter.once;

  // replace the event registration functions so that subsequent
  // registered event listeners for this event are "hijacked" instead
  emitter.on = emitter.addListener = on;
  emitter.once = once;
  emitter.removeListener = removeListener;

  emitter._hijacked = true;
}

/**
 * Checks if `name` is a hijacked event name. If true, then renames the event name
 * to `_hijacked_%name%` and registers ther listener, otherwise registers the
 * listener as-is.
 *
 * @param {String} name
 * @param {Function} fn
 * @api public
 */

function on (name, fn) {
  if (this._hijackedEvents[name]) {
    debug('on: renaming %j event to %j', name, prefix + name);
    name = prefix + name;
  }
  return this._hijackRealAddListener(name, fn);
}

function once (name, fn) {
  if (this._hijackedEvents[name]) {
    debug('once: renaming %j event to %j', name, prefix + name);
    name = prefix + name;
  }
  return this._hijackRealOnce(name, fn);
}

function removeListener (name, fn) {
  if (this._hijackedEvents[name]) {
    debug('removeListener: renaming %j event to %j', name, prefix + name);
    name = prefix + name;
  }
  return this._hijackRealRemoveListener(name, fn);
}
