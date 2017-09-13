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

One notable thing that you get simply for setting up Worker Box is tracking of all Worker instances that get created. This means that when you decide to cleanup Worker Box can terminate all running instances immediately. Pretty nifty.

## Stubbing A Worker

You can [stub](https://en.wikipedia.org/wiki/Method_stub) a Worker by using the `stub` method.

```js
WorkerBox.stub(scriptPath, {
  importScripts: [],
  code: () => {}
});
```

When trying to create a stubbed Worker, the original script will be ignored and instead you will get a Worker that either does nothing or executes code/scripts you have provided.

It takes two arguments:

1. A string path to the Worker to stub.
2. An options object.

The path to the Worker will be resolved relative to your current path. So, if you have tests running at `localhost:8080/tests/index.html`, then using either `/workers/my-worker.js` or `../workers/my-worker.js` will yield the same result.

The options object can define two optional properties.

The first is `importScripts` which allows you to specify an array of paths to other scripts which should be imported into the Worker. These script paths are resolved relative to your current path.

The second is `code` which is a function that defines code to execute within the Worker. This can be any arbitrary code that you wish to execute within the Worker and will have complete access to the Worker's scope. Note that since this code is executed within the Worker you will not have access to the scope outside your function as you normally would.

Note: When using both `importScripts` and `code`, the `importScripts` will be imported _before_ executing the contents of `code`.

## Prepending Code To A Worker

Similarly to stubbing, you can also prepend code to a Worker by using the `prepend` method.

```js
WorkerBox.prepend(scriptPath, {
  importScripts: [],
  code: () => {}
});
```

This is particularly useful for scenarios where you wish to alter some state before the Worker executes, such as setting up a mock server to handle external requests.

The parameters and options for `prepend` are the same as for `stub`. The only difference is that after `importScripts` and `code` execute, the original Worker script will also execute. Note that `importScripts` executed from within your original Worker will resolve paths relative to that Worker's path as they would in normal usage.
