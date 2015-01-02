var page = require('webpage').create();

page.viewportSize = { width: 1000, height: 700 };

page.onConsoleMessage = function(msg) {
  console.log(msg);
};

page.open('inspect.html', function() {
  page.render('example.png');
  phantom.exit();
});
