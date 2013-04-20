(function(window) {
  // Namespacing
  var prevMockie = window.Mockie;

  var M = window.Mockie = {};

  M.noConflict = function() {
    window.Mockie = prevMockie;
    return M;
  };

  // Finds itself and the parent element.
  var scripts = document.getElementsByTagName('script');
  var me = M.element = scripts[scripts.length-1];
  var par = me.parentElement;

  // Mockie communicates through window.name. We prefix every message
  // with this prefix to ensure that messages was actually sent from/to
  // Mockie.
  var namePrefix = ':mockie:';

  // Builds a payload which can be inserted into name=""
  function buildPayload(obj) {
    return namePrefix + JSON.stringify(obj);
  };

  // Parses JSON safely
  function parseJSON(str) {
    try { return JSON.parse(str) } catch (err) { return {} }
  }

  // Searches for the current payload:
  var idx = window.name.search(namePrefix);
  if (idx == -1) {
    M.payload = {};
  } else {
    var payload = window.name.substring(idx + namePrefix.length);
    M.payload = parseJSON(payload);
  }

  // Parse innerHTML as JSON
  M.config = parseJSON(me.innerHTML);

  // Helper for escaping (some) HTML
  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  // Builds an iframe with a payload.
  function buildFrame(file, obj) {
    var payload = buildPayload(obj);

    // It's impossible to set .name directly in IE.
    var ifr = (/MSIE (6|7|8|9)/).test(navigator.userAgent)
      ? document.createElement('<iframe name="'+escapeHTML(payload)+'">')
      : document.createElement('iframe');

    ifr.src = file;
    ifr.name = payload;
    ifr.setAttribute('style', 'position:absolute;top:0;left:-100px;width:1px;height:1px');
    return ifr;
  }

  // This method does all the magic.
  M.expose = function(object) {
    if (M.payload.request) {
      var req = M.payload.request;

      req.args.push(function(data) {
        var res = [M.payload.id, data];
        // Use postMessage if avilable.
        if (parent.postMessage) {
          parent.postMessage(res, '*');
        } else {
          // Use `q=1` to avoid restriction of recursive iframes. Assume
          // that browsers that don't support postMessage treats pages
          // with different query strings as the same origin.
          var frame = buildFrame(req.caller+'?q=1', { response: res });
          par.appendChild(frame);
        }
      });

      object[req.name].apply(window, req.args);

      // Make sure nothing more in this file gets called
      // by throwing an error and swallowing it immidiatly.
      window.onerror = function(){ return true };
      throw '';

    } else if (M.payload.response) {
      var recv = window.parent.parent;
      recv.MOCKIE_RECEIVE.apply(null, M.payload.response);

      // Our job is done. Redirect to a blank page.
      window.location = 'javascript:""';
    }
  }

  var callbacks = {};
  var genId = 0;

  window.MOCKIE_RECEIVE = function(id, res) {
    callbacks[id](null, res);
  };

  // Use postMessage in modern browsers
  if (window.addEventListener) {
    window.addEventListener('message', function(evt) {
      window.MOCKIE_RECEIVE.apply(null, evt.data);
    }, false);
  }

  // Fires off a request
  M.request = function(file, name, args, cb) {
    // args is optional
    if (!cb) {
      cb = args;
      args = [];
    }

    var id = genId++;
    var obj = {
      caller: window.location.toString(),
      name: name,
      args: args
    };

    var done = false;
    var ifr = buildFrame(file, { id: id, request: obj });

    function complete(err, res) {
      if (done) return;
      done = true;
      delete callbacks[id];
      cb(err, res);
      par.removeChild(ifr);
    }

    setTimeout(function() {
      complete("timeout");
    }, 3000);

    callbacks[id] = complete;
    par.appendChild(ifr);
  }
})(window);
