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

  function createWorker(originalScript, code, importScripts, workerOptions) {

    const baseUrl = `${document.location.protocol}//${document.location.host}`;
    const importScriptList = importScripts.map(script => `'${baseUrl}${script}'`).join(', ');

    let codeString = code.toString();
    const needsFunctionKeyword = !codeString.startsWith('function');
    if (needsFunctionKeyword) {

      codeString = `function ${codeString}`;

    }

    const src = `
    (${stubImportScripts.toString()}('${baseUrl}${originalScript}'));
    importScripts(${importScriptList});
    (${codeString}());
    importScripts('${baseUrl}${originalScript}');
    `;
    const blob = new Blob([src], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    return new Worker(url, workerOptions);

  }

  const workerDefinitions = [];

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
  function prepend(script, options = { importScripts: [], code: () => {} }) {

    const workerDefinition = findWorkerDefinition(script);
    if (workerDefinition) {

      throw new Error(`The Worker script "${script}" has already been registered with "${workerDefinition.type}".`);

    }

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
  function stub(script, options) {

    const workerDefinition = findWorkerDefinition(script);
    if (workerDefinition) {

      throw new Error(`The Worker script "${script}" has already been registered with "${workerDefinition.type}".`);

    }

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
      if (workerDefinition) {

        const { options: { code, importScripts } } = workerDefinition;
        return createWorker(script, code, importScripts, workerOptions);

      }

      return new FakeWorker.Original(script, workerOptions);

    }
    FakeWorker.isWorkerBox = true;
    FakeWorker.Original = self.Worker;

    self.Worker = FakeWorker;

  }

  function restore() {

    if (self.Worker.isWorkerBox) {

      workerDefinitions.length = 0;
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
