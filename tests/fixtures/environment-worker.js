self.onmessage = function onmessage(message) {

  'use strict';

  postMessage({
    message: message.data,
    environment: self.env,
  });

};
