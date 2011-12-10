Mockie
======

Mockie is a little framework that gives you simple cross-site requests
in static HTML files. This is especially convenient when you're opening
the files outside of a server (i.e. file://) because of the strict
cross-site rules which Mockie circumvents.

Just to make it clear: Mockie uses no AJAX, HTML5, Flash, Silverlight,
ActiveX or any funky stuff. It just creates some iframes and passes
around data in JSON format. Nothing that wasn't possible ten years ago.

Mockie does not belong in production code, but can rather be used to
implement partials and layouts which works no matter where the files are
located.

Implementing a simple partial system
------------------------------------

To show how you can use Mockie, we're going to implement a simple partial
system. More specifically, we have two files:

### index.html

```html
<script src="partial.js"></script>
<body>
  <h1>Hello</h2>
  <include file="world.html"></include>
</body>
```

### world.html

```html
<script src="partial.js"></script>
<body>
  <h2>World</h2>
</body>
```

When opening index.html we expect the browser to automatically include the
world.html file for us (with no server processing needed).

### partial.js

Because we want everything in one file, we're going to copy mockie.js
and append our own code there:

```js
/* Lots of mockie.js stuff */

// We're going to expose a function that we can call on any file which
// also includes this script file.
Mockie.expose({
  fetchBody: function(done) {
    window.onload = function() {
      done(document.body.innerHTML);
    }
  },
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
```

And that's all there is to it!

Configuration
-------------

Mockie also let's you define configuration in your files:

```html
<script src="mockie.js">
  { "hello": "world" }
</script>
```

This JSON structure is available as `Mockle.config`.

