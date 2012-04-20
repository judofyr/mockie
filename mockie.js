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
  var me = scripts[scripts.length-1];
  var par = me.parentElement;
  par.removeChild(me);

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

  function buildFrame(file, obj) {
    var i = document.createElement('iframe');
    i.src = file;
    i.name = buildPayload(obj);
    i.setAttribute('style', 'position:absolute;top:0;left:-100px;width:1px;height:1px');
    return i;
  }

  M.expose = function(object) {
    if (M.payload.request) {
      var req = M.payload.request;

      req.args.push(function() {
        var answer = Array.prototype.slice.call(arguments);
        par.appendChild(buildFrame(req.caller, {response: answer}));
      });

      object[req.name].apply(ctx, req.args);

      // Make sure nothing more in this file gets called
      // by throwing an error and swallowing it immidiatly.
      ctx.onerror = function(){ return true };
      throw '';

    } else if (M.payload.response) {
      var recv = ctx.parent.parent;
      recv.MOCKIE_RECEIVE.apply(recv, M.payload.response);

      // Our job is done. Redirect to a blank page.
      ctx.location = 'javascript:""';
    }
  }

  var pending = [];

  M.request = function(file, name, args, cb) {
    if (ctx.MOCKIE_RECEIVE) return pending.push(arguments);

    if (!cb) {
      cb = args;
      args = [];
    }

    var obj = {
      caller: ctx.location.toString(),
      name: name,
      args: args
    };
    var ifr = buildFrame(file, { request: obj });

    ctx.MOCKIE_RECEIVE = function() {
      delete ctx.MOCKIE_RECEIVE;
      var nxt = pending.shift();
      if (nxt) M.request.apply(M, nxt);

      cb.apply(ctx, arguments);
      par.removeChild(ifr);
    };

    par.appendChild(ifr);
  }
})(this);

