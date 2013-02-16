node-event-hijack
=================
### Hijacks the specified EventEmitter event

Hijacks the specified EventEmitter event name.


Installation
------------

``` bash
$ npm install event-hijack
```


Example
-------

``` javascript
var hijack = require('event-hijack');
var EventEmitter = require('events').EventEmitter;

// our test subject "emitter" instance
var emitter = new EventEmitter();

// you can use the emitter normally
emitter.on('thing', function () {
  console.log('got "thing"');
});

emitter.emit('thing');


// once you "hijack" the event, subsequent listeners added for that
// event will *not* be added as regular listeners for that event
var emitThing = hijack(emitter, 'thing', function () {
  console.log('this is an *original* "thing" event');
});

// this will *not* be a "thing" listener. instead, you must
// invoke `emitThing()` for this callback to be invoked
emitter.on('thing', function () {
  console.log('this is a *hijacked* event listener');
});

// emit a fake "thing" event, the original listener will not be invoked,
// but the hijacked listener *will* be invoked
emitThing();
```
