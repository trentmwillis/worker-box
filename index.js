window.WorkerBox = (function initWorkerBox() {

  'use strict';

  function stubImportScripts(base) {

    const originalImportScripts = self.importScripts;
    self.importScripts = function stubbedImportScripts(...scripts) {

      scripts.forEach((script) => {

        originalImportScripts(new URL(script, base));

      });

    };

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

  function createWorkerPrepend(originalScript, code, importScripts, workerOptions) {

    const baseUrl = `${document.location.protocol}//${document.location.host}`;
    const importScriptList = importScripts.map(script => `'${baseUrl}${script}'`).join(', ');

    const src = `
    (${stubImportScripts.toString()}('${baseUrl}${originalScript}'));
    importScripts(${importScriptList});
    ${stringifyFunction(code)}
    importScripts('${baseUrl}${originalScript}');
    `;
    const blob = new Blob([src], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    return new Worker(url, workerOptions);

  }

  function createWorkerStub(workerDefinition, workerOptions) {

    const { options: { code, importScripts } } = workerDefinition;
    const src = [];

    if (importScripts.length) {

      const importScriptList = importScripts.map(script => `'${script}'`).join(', ');

      src.push(`(${stubImportScripts.toString()}('${location.href}'));`);
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
  function prepend(script, options) {

    const workerDefinition = findWorkerDefinition(script);
    if (workerDefinition) {

      throw new Error(`The Worker script "${script}" has already been registered with "${workerDefinition.type}".`);

    }

    options.importScripts = options.importScripts || [];
    options.code = options.code || (() => {});

    workerDefinitions.push({
      type: 'prepend',
      script,
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

    const workerDefinition = findWorkerDefinition(script);
    if (workerDefinition) {

      throw new Error(`The Worker script "${script}" has already been registered with "${workerDefinition.type}".`);

    }

    options.importScripts = options.importScripts || [];
    options.code = options.code || (() => {});

    workerDefinitions.push({
      type: 'stub',
      script,
      options,
    });

  }

  function setup() {

    if (self.Worker.isWorkerBox) {

      return;

    }

    function FakeWorker(script, workerOptions) {

      const workerDefinition = findWorkerDefinition(script);
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

  function restore() {

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
    restore,
  };

}());
