QUnit.module('WorkerBox', function(hooks) {

  'use strict';

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

  QUnit.module('stub', function() {

  });

  QUnit.module('prepend', function() {

  });

  QUnit.module('create', function() {

  });

});
