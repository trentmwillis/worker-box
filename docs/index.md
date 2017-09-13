Worker Box is a toolbox to help you test [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). It provides an easy way to stub and modify your Workers without complicated test servers or monkey patches.

## Setup and Cleanup

To use Worker Box, you start by simply calling:

```js
WorkerBox.setup();
```

By default, this won't do much except replace your global `Worker` class with a wrapper that allows Worker Box to work its magic.

On the flip side, when you're ready to stop using Worker Box (such as at the end of a test), you simply call:

```js
WorkerBox.cleanup();
```

One notable thing that Worker Box does after being set up is track all Worker instances that get created. This way, when you decide to cleanup, it can terminate all running instances immediately. Pretty nifty.

## Stubbing A Worker

```js
WorkerBox.stub(scriptPath, {
  importScripts: [],
  code: () => {}
});
```

## Prepending Code To A Worker

```js
WorkerBox.prepend(scriptPath, {
  importScripts: [],
  code: () => {}
});
```
