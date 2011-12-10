(function(a){function h(a){try{return JSON.parse(a)}catch(b){return{}}}function k(a,b){var c=document.createElement("iframe");return c.src=a,c.name=d+JSON.stringify(b),c.setAttribute("style","position:absolute;top:0;left:-100px;width:1px;height:1px"),c}var b=a.Mockie,c=a.Mockie={};c.noConflict=function(){return a.Mockie=b,c};var d=":mockie:",e=document.getElementsByTagName("script"),f=e[e.length-1],g=f.parentElement;g.removeChild(f),Mockie.config=h(f.innerHTML);var i=a.name.search(d);if(i==-1)c.payload={};else{var j=a.name.substring(i+d.length);c.payload=h(j)}c.expose=function(b){if(c.payload.request){var d=c.payload.request;throw d.args.push(function(){var a=Array.prototype.slice.call(arguments);g.appendChild(k(d.caller,{response:a}))}),b[d.name].apply(a,d.args),a.onerror=function(){return!1},""}if(c.payload.response){var e=a.parent.parent;e.MOCKIE_RECEIVE.apply(e,c.payload.response),a.location='javascript:""'}};var l=[];c.request=function(b,d,e,f){if(a.MOCKIE_RECEIVE)return l.push(arguments);f||(f=e,e=[]);var h={caller:a.location.toString(),name:d,args:e},i=k(b,{request:h});a.MOCKIE_RECEIVE=function(){delete a.MOCKIE_RECEIVE;var b=l.shift();b&&c.request.apply(c,b),f.apply(a,arguments),g.removeChild(i)},g.appendChild(i)}})(this);

// We're going to expose a function that we can call on any file which
// also includes this script file.
Mockie.expose({
  fetchBody: function(done) {
    window.onload = function() {
      done(document.body.innerHTML);
    }
  }
});

window.onload = function() {
  var includes = document.getElementsByTagName('include');
  var forEach = Array.prototype.forEach;
  forEach.call(includes, function(inc) {
    // Figure out which file we're going to include
    var file = inc.getAttribute('file');
    // Run the fetchBody-method in the file
    Mockie.request(file, 'fetchBody', function(html) {
      // Insert the content right after the <include>-tag
      inc.insertAdjacentHTML('afterend', html);
      // Remove the <include>-tag
      inc.parentElement.removeChild(inc);
    });
  });
};

