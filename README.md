# Worker Box [![Build Status](https://travis-ci.org/trentmwillis/worker-box.svg?branch=master)](https://travis-ci.org/trentmwillis/worker-box) [![Documentation](https://media.readthedocs.org/static/projects/badges/passing.svg)](https://pretty-okay.com/worker-box) [![NPM Version](https://badge.fury.io/js/worker-box.svg)](https://www.npmjs.com/package/worker-box)

Worker Box is a toolbox to help you test [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API). It provides an easy way to create, stub, and modify your Workers without complicated test servers or monkey patches. For more info, be sure to check out the [documentation](https://pretty-okay.com/worker-box/)!

## Installation

Install Worker Box through [npm](https://www.npmjs.com/):

```bash
npm install --save-dev worker-box
```

And then load it via a script tag in your page:

```html
<script src="/node_modules/worker-box/index.js"></script>
```

And that's it! The `WorkerBox` global should now be available for use.

## Usage

For information on how to use Worker Box and the APIs it provides, check out [the official documentation]([documentation](https://pretty-okay.com/worker-box/)).
