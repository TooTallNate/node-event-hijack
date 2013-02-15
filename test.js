
var hijack = require('./');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

var emitter = new EventEmitter();
var beforeCalled, hijackCalled, afterCalled, ontestCalled;

emitter.on('test', function () {
  beforeCalled = true;
  assert.equal(3, arguments.length);
  assert.equal(1, arguments[0]);
  assert.equal(2, arguments[1]);
  assert.equal(3, arguments[2]);
});

// hijack the "test" event
var emitTest = hijack(emitter, 'test', function () {
  hijackCalled = true;
  assert.equal(3, arguments.length);
  assert.equal(1, arguments[0]);
  assert.equal(2, arguments[1]);
  assert.equal(3, arguments[2]);
});

emitter.on('test', function () {
  afterCalled = true;
  assert.equal(3, arguments.length);
  assert.equal(4, arguments[0]);
  assert.equal(5, arguments[1]);
  assert.equal(6, arguments[2]);
});

emitter.ontest = function () {
  ontestCalled = true;
  assert.equal(3, arguments.length);
  assert.equal(4, arguments[0]);
  assert.equal(5, arguments[1]);
  assert.equal(6, arguments[2]);
};

// emit real and hijacked "test" events
beforeCalled = hijackCalled = afterCalled = ontestCalled = false;

emitter.emit('test', 1, 2, 3);
assert.equal(true, beforeCalled);
assert.equal(true, hijackCalled);
assert.equal(false, afterCalled);
assert.equal(false, ontestCalled);

beforeCalled = hijackCalled = afterCalled = ontestCalled = false;

emitTest(4, 5, 6);
assert.equal(false, beforeCalled);
assert.equal(false, hijackCalled);
assert.equal(true, afterCalled);
assert.equal(true, ontestCalled);



// the "data" event gets very minor special handling...
var emitData = hijack(emitter, 'data', function (b) {
  hijackCalled = true;
});

emitter.ondata = function (b, start, end) {
  assert.strictEqual(buf, b);
  assert.equal(0, start);
  assert.equal(b.length, end);
};

var buf = new Buffer('hello world');
emitData(buf);
