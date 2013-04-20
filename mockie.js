(function(ctx) {
  var prevMockie = ctx.Mockie;

  var M = ctx.Mockie = {};

  M.noConflict = function() {
    ctx.Mockie = prevMockie;
    return M;
  };

  var namePrefix = ':mockie:';

  var buildPayload = M.buildPayload = function(obj) {
    return namePrefix + JSON.stringify(obj);
  };

  var scripts = document.getElementsByTagName('script');
  var me = M.element = scripts[scripts.length-1];
  var par = me.parentElement;

  function parseJSON(str) {
    try { return JSON.parse(str) } catch (err) { return {} }
  }

  Mockie.config = parseJSON(me.innerHTML);

  var idx = ctx.name.search(namePrefix);
  if (idx == -1) {
    M.payload = {};
  } else {
    var payload = ctx.name.substring(idx + namePrefix.length);
    M.payload = parseJSON(payload);
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function buildFrame(file, obj) {
    var payload = buildPayload(obj);

    // WHY can't I set "name" in IE???
    var ifr = (/MSIE (6|7|8|9)/).test(navigator.userAgent)
      ? document.createElement('<iframe name="'+escapeHTML(payload)+'">')
      : document.createElement('iframe');

    ifr.src = file;
    ifr.name = payload;
    ifr.setAttribute('style', 'position:absolute;top:0;left:-100px;width:1px;height:1px');
    return ifr;
  }

  M.expose = function(object) {
    if (M.payload.request) {
      var req = M.payload.request;

      req.args.push(function(data) {
        var res = [M.payload.id, data];
        // Use postMessage if avilable
        if (parent.postMessage) {
          parent.postMessage(res, '*');
        } else {
          // Use `q=1` to avoid restriction of recursive iframes. Assume
          // that browsers that don't support postMessage treats pages
          // with different query strings as the same origin
          var frame = buildFrame(req.caller+'?q=1', res);
          par.appendChild(frame);
        }
      });

      object[req.name].apply(ctx, req.args);

      // Make sure nothing more in this file gets called
      // by throwing an error and swallowing it immidiatly.
      ctx.onerror = function(){ return true };
      throw '';

    } else if (M.payload.response) {
      var recv = ctx.parent.parent;
      recv.MOCKIE_RECEIVE.apply(null, M.response);

      // Our job is done. Redirect to a blank page.
      ctx.location = 'javascript:""';
    }
  }

  var callbacks = {};
  var genId = 0;

  ctx.MOCKIE_RECEIVE = function(id, res) {
    callbacks[id](null, res);
  };

  if (window.addEventListener)
    window.addEventListener('message', function(evt) {
      ctx.MOCKIE_RECEIVE.apply(null, evt.data);
    }, false);

  M.request = function(file, name, args, cb) {
    if (!cb) {
      cb = args;
      args = [];
    }

    var id = genId++;
    var obj = {
      caller: ctx.location.toString(),
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
    }

    setTimeout(function() {
      complete("timeout");
    }, 3000);

    callbacks[id] = complete;
    par.appendChild(ifr);
  }
})(this);
