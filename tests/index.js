QUnit.module('WorkerBox', function(hooks) {

  'use strict';

  hooks.afterEach(function() {

    WorkerBox.cleanup();

  });

  QUnit.test('ensure /tests/fixtures/simple-worker.js behaves as expected', async function(assert) {

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

  QUnit.test('ensure /tests/fixtures/environment-worker.js behaves as expected', async function(assert) {

    const done = assert.async();
    const originalMessage = 'foo';
    const worker = new Worker('/tests/fixtures/environment-worker.js');
    worker.onmessage = (message) => {

      assert.deepEqual(message.data, {
        message: originalMessage,
        environment: undefined,
      });
      worker.terminate();
      done();

    };
    worker.postMessage(originalMessage);

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

  QUnit.module('create', function() {

    QUnit.test('creates a worker from the given function', function(assert) {

      const done = assert.async();
      const originalMessage = 'foo';
      const worker = WorkerBox.create(() => {

        self.onmessage = function onmessage(message) {

          postMessage(`it works, ${message.data}!`);

        };

      });
      worker.onmessage = (message) => {

        assert.strictEqual(message.data, 'it works, foo!');
        worker.terminate();
        done();

      };
      worker.postMessage(originalMessage);

    });

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
        importScripts: ['/tests/fixtures/define-env.js'],
        code() {

          self.onmessage = function onmessage() {

            postMessage(self.env);

          };

        },
      });

      const done = assert.async();
      const originalMessage = 'foo';
      const worker = new Worker('/tests/fixtures/simple-worker.js');
      worker.onmessage = (message) => {

        assert.deepEqual(message.data, { from: 'define-env' });
        done();

      };
      worker.postMessage(originalMessage);

    });

    QUnit.test('throws an error if script has already been registered', function(assert) {

      WorkerBox.setup();
      WorkerBox.stub('/tests/fixtures/simple-worker.js');
      assert.throws(() => WorkerBox.stub('/tests/fixtures/simple-worker.js'), /The Worker script "\/tests\/fixtures\/simple-worker.js" has already been registered with "stub"/);

    });

    QUnit.test('throws an error if script has already been registered with a different relative path', function(assert) {

      WorkerBox.setup();
      WorkerBox.stub('/tests/fixtures/simple-worker.js');
      assert.throws(() => WorkerBox.stub('../../tests/fixtures/simple-worker.js'), /The Worker script "..\/..\/tests\/fixtures\/simple-worker.js" has already been registered with "stub"/);

    });

    QUnit.test('imported scripts are resolved relative to the current path', function(assert) {

      WorkerBox.setup();
      WorkerBox.stub('/tests/fixtures/simple-worker.js', {
        importScripts: ['../../tests/fixtures/define-env.js'],
        code() {

          self.importScripts('../../tests/fixtures/define-env-2.js');
          self.onmessage = function onmessage() {

            postMessage(self.env);

          };

        },
      });

      const done = assert.async();
      const originalMessage = 'foo';
      const worker = new Worker('/tests/fixtures/simple-worker.js');
      worker.onmessage = (message) => {

        assert.deepEqual(message.data, {
          from: 'define-env',
          again: 'define-env-2',
        });
        done();

      };
      worker.postMessage(originalMessage);

    });

  });

  QUnit.module('prepend', function() {

    QUnit.test('prepends the specified code to the specified script', function(assert) {

      WorkerBox.setup();
      WorkerBox.prepend('/tests/fixtures/environment-worker.js', {
        code() {

          self.env = 'derp;herp';

        },
      });

      const done = assert.async();
      const originalMessage = 'foo';
      const worker = new Worker('/tests/fixtures/environment-worker.js');
      worker.onmessage = (message) => {

        assert.deepEqual(message.data, {
          message: originalMessage,
          environment: 'derp;herp',
        });
        worker.terminate();
        done();

      };
      worker.postMessage(originalMessage);

    });

    QUnit.test('prepends the specified imports to the specified script', function(assert) {

      WorkerBox.setup();
      WorkerBox.prepend('/tests/fixtures/environment-worker.js', {
        importScripts: ['/tests/fixtures/define-env.js'],
      });

      const done = assert.async();
      const originalMessage = 'foo';
      const worker = new Worker('/tests/fixtures/environment-worker.js');
      worker.onmessage = (message) => {

        assert.deepEqual(message.data, {
          message: originalMessage,
          environment: {
            from: 'define-env',
          },
        });
        worker.terminate();
        done();

      };
      worker.postMessage(originalMessage);

    });

    QUnit.test('prepends the specified code and imports to the specified script', function(assert) {

      WorkerBox.setup();
      WorkerBox.prepend('/tests/fixtures/environment-worker.js', {
        importScripts: ['/tests/fixtures/define-env.js'],
        code() {

          self.env = Object.assign(self.env, { prepend: 'derp;herp' });

        },
      });

      const done = assert.async();
      const originalMessage = 'foo';
      const worker = new Worker('/tests/fixtures/environment-worker.js');
      worker.onmessage = (message) => {

        assert.deepEqual(message.data, {
          message: originalMessage,
          environment: {
            from: 'define-env',
            prepend: 'derp;herp',
          },
        });
        worker.terminate();
        done();

      };
      worker.postMessage(originalMessage);

    });

    QUnit.test('throws an error if script has already been registered', function(assert) {

      WorkerBox.setup();
      WorkerBox.prepend('/tests/fixtures/simple-worker.js');
      assert.throws(() => WorkerBox.prepend('/tests/fixtures/simple-worker.js'), /The Worker script "\/tests\/fixtures\/simple-worker.js" has already been registered with "prepend"/);

    });

    QUnit.test('throws an error if script has already been registered with a different relative path', function(assert) {

      WorkerBox.setup();
      WorkerBox.prepend('/tests/fixtures/simple-worker.js');
      assert.throws(() => WorkerBox.prepend('../../tests/fixtures/simple-worker.js'), /The Worker script "..\/..\/tests\/fixtures\/simple-worker.js" has already been registered with "prepend"/);

    });

    QUnit.test('imported scripts are resolved relative to the current path', function(assert) {

      WorkerBox.setup();
      WorkerBox.prepend('/tests/fixtures/environment-worker.js', {
        importScripts: ['../../tests/fixtures/define-env.js'],
        code() {

          self.importScripts('../../tests/fixtures/define-env-2.js');

        },
      });

      const done = assert.async();
      const originalMessage = 'foo';
      const worker = new Worker('/tests/fixtures/environment-worker.js');
      worker.onmessage = (message) => {

        assert.deepEqual(message.data, {
          message: originalMessage,
          environment: {
            from: 'define-env',
            again: 'define-env-2',
          },
        });
        worker.terminate();
        done();

      };
      worker.postMessage(originalMessage);

    });

    QUnit.test('imported scripts within original worker are resolved relative to the worker\'s path', function(assert) {

      WorkerBox.setup();
      WorkerBox.prepend('/tests/fixtures/import-worker.js');

      const done = assert.async();
      const originalMessage = 'foo';
      const worker = new Worker('/tests/fixtures/import-worker.js');
      worker.onmessage = (message) => {

        assert.deepEqual(message.data, {
          message: originalMessage,
          environment: {
            from: 'define-env',
          },
        });
        worker.terminate();
        done();

      };
      worker.postMessage(originalMessage);

    });

  });

});
