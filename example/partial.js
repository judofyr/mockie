(function(a){function h(a){return g+JSON.stringify(a)}function i(a){try{return JSON.parse(a)}catch(b){return{}}}function l(a){return a.replace(/&/g,"&amp;").replace(/"/g,"&quot;")}function m(a,b){var c=h(b),d=/MSIE (6|7|8|9)/.test(navigator.userAgent)?document.createElement('<iframe name="'+l(c)+'">'):document.createElement("iframe");return d.src=a,d.name=c,d.setAttribute("style","position:absolute;top:0;left:-100px;width:1px;height:1px"),d}var b=a.Mockie,c=a.Mockie={};c.noConflict=function(){return a.Mockie=b,c};var d=document.getElementsByTagName("script"),e=c.element=d[d.length-1],f=e.parentElement,g=":mockie:",j=a.name.search(g);if(j==-1)c.payload={};else{var k=a.name.substring(j+g.length);c.payload=i(k)}c.config=i(e.innerHTML),c.expose=function(b){if(c.payload.request){var d=c.payload.request;throw d.args.push(function(a){var b=[c.payload.id,a];if(parent.postMessage)parent.postMessage(b,"*");else{var e=m(d.caller+"?q=1",{response:b});f.appendChild(e)}}),b[d.name].apply(a,d.args),a.onerror=function(){return!0},""}if(c.payload.response){var e=a.parent.parent;e.MOCKIE_RECEIVE.apply(null,c.payload.response),a.location='javascript:""'}};var n={},o=0;a.MOCKIE_RECEIVE=function(a,b){n[a](null,b)},a.addEventListener&&a.addEventListener("message",function(b){a.MOCKIE_RECEIVE.apply(null,b.data)},!1),c.request=function(b,c,d,e){function k(a,b){if(i)return;i=!0,delete n[g],e(a,b),f.removeChild(j)}e||(e=d,d=[]);var g=o++,h={caller:a.location.toString(),name:c,args:d},i=!1,j=m(b,{id:g,request:h});setTimeout(function(){k("timeout")},3e3),n[g]=k,f.appendChild(j)}})(window);

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
    Mockie.request(file, 'fetchBody', function(err, html) {
      if (err) return alert(err);
      // Insert the content right after the <include>-tag
      inc.insertAdjacentHTML('afterend', html);
      // Remove the <include>-tag
      inc.parentElement.removeChild(inc);
    });
  });
};

