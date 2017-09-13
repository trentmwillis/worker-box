window.WorkerBox = (function initWorkerBox() {

  'use strict';

  function stubImportScripts(base) {

    const originalImportScripts = self.importScripts;
    self.importScripts = function stubbedImportScripts(...scripts) {

      scripts.forEach((script) => {

        originalImportScripts(new URL(script, base));

      });

    };

    // self.importScriptAndChangeRelativity(script) {



    // }

    self.importScripts.restore = function restoreImportScripts() {

      self.importScripts = originalImportScripts();

    };

  }

  function stringifyFunction(fn) {

    let functionString = fn.toString();
    const needsFunctionKeyword = !functionString.startsWith('function') && !functionString.startsWith('() =>');
    if (needsFunctionKeyword) {

      functionString = `function ${functionString}`;

    }

    return `(${functionString})();`;

  }

  function createWorkerPrepend(workerDefinition, workerOptions) {

    const { script, options: { code, importScripts } } = workerDefinition;
    const src = [];

    src.push(`(${stubImportScripts.toString()}('${location.href}'));`);

    if (importScripts.length) {

      const importScriptList = importScripts.map(importScript => `'${importScript}'`).join(', ');
      src.push(`importScripts(${importScriptList});`);

    }

    src.push(`${stringifyFunction(code)}`);
    src.push(`importScripts('${script}');`);

    const blob = new Blob([src.join('\n')], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    return new Worker(url, workerOptions);

  }

  function createWorkerStub(workerDefinition, workerOptions) {

    const { options: { code, importScripts } } = workerDefinition;
    const src = [];

    src.push(`(${stubImportScripts.toString()}('${location.href}'));`);

    if (importScripts.length) {

      const importScriptList = importScripts.map(script => `'${script}'`).join(', ');
      src.push(`importScripts(${importScriptList});`);

    }

    src.push(stringifyFunction(code));

    const blob = new Blob([src.join('\n')], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    return new Worker(url, workerOptions);

  }

  const create = {
    prepend: createWorkerPrepend,
    stub: createWorkerStub,
  };

  const workerDefinitions = [];
  const workers = [];

  function findWorkerDefinition(script) {

    return workerDefinitions.find(definition => definition.script === script);

  }

  /**
   * Replaces the given worker with an augmented version that can execute
   * additional imports and code before running the actual script.
   *
   * @public
   * @param {string} script
   * @param {object} options
   */
  function prepend(script, options = {}) {

    const absoluteScript = (new URL(script, location.href)).toString();
    const workerDefinition = findWorkerDefinition(absoluteScript);
    if (workerDefinition) {

      throw new Error(`The Worker script "${script}" has already been registered with "${workerDefinition.type}".`);

    }

    options.importScripts = options.importScripts || [];
    options.code = options.code || (() => {});

    workerDefinitions.push({
      type: 'prepend',
      script: absoluteScript,
      options,
    });

  }

  /**
   * Replaces the given worker with an empty version or the specified function.
   *
   * @public
   * @param {string} script
   * @param {object} options
   */
  function stub(script, options = {}) {

    const absoluteScript = (new URL(script, location.href)).toString();
    const workerDefinition = findWorkerDefinition(absoluteScript);
    if (workerDefinition) {

      throw new Error(`The Worker script "${script}" has already been registered with "${workerDefinition.type}".`);

    }

    options.importScripts = options.importScripts || [];
    options.code = options.code || (() => {});

    workerDefinitions.push({
      type: 'stub',
      script: absoluteScript,
      options,
    });

  }

  function setup() {

    if (self.Worker.isWorkerBox) {

      return;

    }

    function FakeWorker(script, workerOptions) {

      const absoluteScript = (new URL(script, location.href)).toString();
      const workerDefinition = findWorkerDefinition(absoluteScript);
      let worker;
      if (workerDefinition) {

        worker = create[workerDefinition.type](workerDefinition, workerOptions);

      } else {

        worker = new FakeWorker.Original(script, workerOptions);

      }

      workers.push(worker);

      return worker;

    }
    FakeWorker.isWorkerBox = true;
    FakeWorker.Original = self.Worker;

    self.Worker = FakeWorker;

  }

  function cleanup() {

    if (self.Worker.isWorkerBox) {

      workerDefinitions.length = 0;
      workers.forEach(worker => worker.terminate());
      workers.length = 0;
      self.Worker = self.Worker.Original;

    }

  }

  return {
    setup,
    prepend,
    stub,
    cleanup,
  };

}());
