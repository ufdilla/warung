# DI+KISS

[![Build Status](https://travis-ci.org/lekoder/diss.svg?branch=master)](https://travis-ci.org/lekoder/diss)
[![Coverage Status](https://coveralls.io/repos/github/lekoder/diss/badge.svg?branch=master)](https://coveralls.io/github/lekoder/diss?branch=master)

DISS is simple and convinient dependency injector for `node.js`. It usees similar pattern to AngularJS
dependency injector.

# Usage
## Provider/factory/forge pattern

To use DISS you should use a provider pattern for your code.

Instead of:
```js
var d1 = require('d1'),
    d2 = require('d2');

module.exports = {
    method: m1
}    
```
Use:
```js
module.exports = function( d1, d2 ) {
    return {
        method: m1
    }
}
```

## Quick start
main.js
```js
var diss = require('diss')(),
    pkg = require('./package.json');
    
// automaticly load all dependencies defined in package.json and register them under their own names    
diss.loadDependencies(pkg);  

// load providers from files and register them under same names: 
diss.loadProviders(['cfg', 'logger', 'worker', 'rest']);

// register pkg as 'pkg', so it can be used by our modules
diss.register.module('pkg',pkg);

// start actual application.
diss.resolve(function(rest) {
   rest.startServer(); 
});
```
## API

`require('diss')` gives you a injector provider. Call it to get an instance of incejctor. Register
all your dependencies and call it's `resolve` on your main application provider.  

### resolve(provider)
* `provider`: provider to resolve.

Takes a provider, examines it's signature using reflection and injects all it's depencencies.
If any of said dependencies are providers themselves, it will resolve their  dependencies recursively.

```js
diss.resolve(function(mysql, logger, http) {
    // [...] 
});
```

### require(name,[main])
* `name`: string representing a name of module to load and register.
* `main`: module to call require from. Defaults to `require.main`, which is the entry pointof application. 

A convinience method, shortcut to:
```js
diss.register.module('name', require('name') );
diss.register.module('name', main.require('name') );
``` 

### loadDepencencies(pkg,[main])
* `pkg`: object representing `package.json`, ie. `require('package.json')` 
* `main`: module to call require from. Defaults to `require.main`, which is the entry pointof application.

A convinience method, equivalent to iterating over all dependencies listed in `package.json` and calling
`diss.require` on all of them.

```js
diss.loadDependencies(require('package.json'));
```
### loadProviders(providers, [main], [directory])
* `providers`: array of string names of your providers.
* `main`: module to call require from. Defaults to `require.main`, which is the entry pointof application.
* `directory`: directory to load from. Defaults to current directory.
 
A convinience method, equivalent to call of `diss.register.provider` on all supplied files.

```js
diss.loadProviders(['mod1','mod2','mod3','foo/mod4'])
diss.loadProviders(['bar/a','bar/b'],module,'./src/examlpe');
```
is equivalent to:
```js
diss.register.provider('mod1', require('./mod1'));
diss.register.provider('mod2', require('./mod2'));
diss.register.provider('mod3', require('./mod3'));
diss.register.provider('fooMod4', require('./foo/mod3'));
diss.register.provider('barA', require('./src/example/bar/a'));
diss.register.provider('barB', require('./src/example/bar/b'));
```

### register.module(name, module)
* `name`: string containing name to register.
* `module`: object to register under that sting.

Module is a object provied as-is to providers when resolving them. Use modules for non-DI
dependencies, ie:

```js
diss.register.module('Promise', require('bluebird') );
///[...]
diss.resolve(function( Promise ) {
    // Promise contains bluebird module
});
```

### register.provider(name, provider)
* `name`: string containing name to register.
* `provider`: provider to register.

Provider is a function that has dependencies as parameters and returns an object, which is
passed as dependency to other providers.

```js
diss.register.provider('myLogger', function(genericLogger, pkg) {
    return genericLogger.createInstance({
        name: pkg.name,
        level: 'info'
    });
});

diss.resolve(function( myLogger ) {
    // myLogger here will be the result of .createInstance
});
```

## Auto-generated names
When names are auto-generated using convinience methods, they are based
on passed name and camelcased: `some-module` becomes `someModule` in dependencies.

