QUnit.module('WorkerBox', function(hooks) {

  'use strict';

  function waitFor(time) {

    const startTime = Date.now();
    return new Promise((resolve) => {

      function tick() {

        if (Date.now() - startTime > time) {

          resolve();

        } else {

          setTimeout(tick);

        }

      }

      tick();

    });

  }

  hooks.afterEach(function() {

    WorkerBox.restore();

  });

  QUnit.module('setup', function() {

    QUnit.test('replaces the global Worker with a FakeWorker', function(assert) {

      const originalWorker = self.Worker;
      assert.notOk('isWorkerBox' in Worker);
      assert.notOk('Original' in Worker);

      WorkerBox.setup();

      assert.ok('isWorkerBox' in Worker);
      assert.ok('Original' in Worker);

      assert.notStrictEqual(Worker, originalWorker);
      assert.strictEqual(Worker.Original, originalWorker);

    });

  });

  QUnit.test('/tests/fixtures/simple-worker.js', async function(assert) {

    const done = assert.async();
    const originalMessage = 'foo';
    const worker = new Worker('/tests/fixtures/simple-worker.js');
    worker.onmessage = (message) => {

      assert.strictEqual(message.data, originalMessage);
      worker.terminate();
      done();

    };
    worker.postMessage(originalMessage);

  });

  QUnit.module('stub', function(nestedHooks) {

    nestedHooks.beforeEach(function() {

      this.baseWorker = new Worker('/tests/fixtures/simple-worker.js');

    });

    nestedHooks.afterEach(function() {

      this.baseWorker.terminate();

    });

    QUnit.test('replaces the specified script with a no-op', function(assert) {

      assert.expect(0);

      WorkerBox.setup();
      WorkerBox.stub('/tests/fixtures/simple-worker.js');

      const originalMessage = 'foo';
      const worker = new Worker('/tests/fixtures/simple-worker.js');
      worker.onmessage = () => assert.ok(false);
      worker.postMessage(originalMessage);

      const done = assert.async();
      this.baseWorker.onmessage = done;
      this.baseWorker.postMessage(originalMessage);

    });

    QUnit.test('replaces the specified script with the specified code', function(assert) {

      WorkerBox.setup();
      WorkerBox.stub('/tests/fixtures/simple-worker.js', {
        code() {

          self.onmessage = function onmessage(message) {

            postMessage(`stubbed ${message.data}`);

          };

        },
      });

      const done = assert.async();
      const originalMessage = 'foo';
      const worker = new Worker('/tests/fixtures/simple-worker.js');
      worker.onmessage = (message) => {

        assert.equal(message.data, `stubbed ${originalMessage}`);
        done();

      };
      worker.postMessage(originalMessage);

    });

    QUnit.test('replaces the specified script with the specified code and imports before it executes', function(assert) {

      WorkerBox.setup();
      WorkerBox.stub('/tests/fixtures/simple-worker.js', {
        importScripts: ['/tests/fixtures/define-global.js'],
        code() {

          self.onmessage = function onmessage() {

            postMessage(`global is defined ${global === 'global'}`);

          };

        },
      });

      const done = assert.async();
      const originalMessage = 'foo';
      const worker = new Worker('/tests/fixtures/simple-worker.js');
      worker.onmessage = (message) => {

        assert.equal(message.data, 'global is defined true');
        done();

      };
      worker.postMessage(originalMessage);

    });

    QUnit.test('throws an error if script has already been stubbed', function(assert) {

      WorkerBox.setup();
      WorkerBox.stub('/tests/fixtures/simple-worker.js');
      assert.throws(() => WorkerBox.stub('/tests/fixtures/simple-worker.js'), /The Worker script "\/tests\/fixtures\/simple-worker.js" has already been registered with "stub"/);

    });

  });

  QUnit.module('prepend', function() {

    QUnit.test('prepends the specified code to the specified script', function(assert) {

    });

    QUnit.test('prepends the specified imports to the specified script', function(assert) {

    });

    QUnit.test('prepends the specified code and imports to the specified script', function(assert) {

    });

    QUnit.test('throws an error if script has already been prepended', function(assert) {

    });

  });

  QUnit.module('create', function() {

  });

});
