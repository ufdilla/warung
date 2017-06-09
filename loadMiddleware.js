var bodyParser = require('body-parser');
var expressValidator = require('express-validator');

module.exports = app => {
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(expressValidator({

  }));
  app.use(bodyParser.json());
};

//
// app.use(expressValidator({
//   errorFormatter: function(param, msg, value) {
//       var namespace = param.split('.')
//       , root    = namespace.shift()
//       , formParam = root;
//
//     while(namespace.length) {
//       formParam += '[' + namespace.shift() + ']';
//     }
//     return {
//       param : formParam,
//       msg   : msg,
//       value : value
//     };
//   }
// }));
