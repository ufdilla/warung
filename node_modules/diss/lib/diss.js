"use strict";

function dissForge() {
    var registry = {}, resolved = {};

    function canonizeName(name) {
        return name.split(/[^\w]/)
            .filter(function(s) { return !!s })
            .map(function(s,idx) {
                if (idx===0) return s;
                return s[0].toUpperCase() + s.substring(1)
            }).join('');
    }

    function getResolved(name) {
        if (resolved.hasOwnProperty(name)) {
            if (!resolved[name].module) {
                throw new SyntaxError("Circual dependency detected in " + name);
            }
        } else {
            if (registry.hasOwnProperty(name)) {
                resolved[name] = {
                    module: undefined,
                    useCount: 0
                };
                registry[name].useCount += 1;
                resolved[name].module = resolve(registry[name].provider);
            } else {
                throw new SyntaxError("Module " + name+" does not exist or is not registrated");
            }
        }
        resolved[name].useCount += 1;
        return resolved[name];
    }

    function registerModule(name, module) {
        //
        // Register a module.
        //
        // Module is a object which will be passed verbatim to providers depending on it. 
        //
        if (typeof (name) !== 'string') {
            throw TypeError("Module name must be a string");
        }
        resolved[canonizeName(name)] = {
            module,
            useCount: 0
        }
        return diss;
    }
    
    function requireWrapper(name, main) {
        //
        // Shorthand to diss.register.module('name',require('name'));
        //     
        registerModule(name, ( main || require.main ).require(name));
        return diss;
    }
    
    function loadDependencies(pkg ,main) {
        //
        // Loads all dependencies from given module. Usually you should call it with `require.main`
        //
        Object.keys(pkg.dependencies || {}).forEach( name => requireWrapper(name, main || require.main) );
        return diss;
    }
    
    function loadProviders(providers, main, directory ) {
        //
        // Loads providers for given module.
        //
        const from = main || require.main;
        providers.forEach( name => diss.register.provider(name, from.require( (directory || ".") + '/' + name)) )
    }

    function registerProvider(name, provider) {
        // 
        // Register a provider.
        //
        // Provider is a function whose arguments are dependencies. It should create instance of module,
        // which will be passed to providers depending on it.
        // 
        
        if (typeof (name) !== 'string') {
            throw TypeError("Module name must be a string");
        }
        if (provider instanceof Function) {
            registry[canonizeName(name)] = {
                provider,
                useCount: 0
            }
        } else {
            throw new TypeError(name+" is not a function. Only forges can be registrated.");
        }
        return diss;
    }
    
    function resolve(provider) {
        //
        // Resolves a module. 
        //
        if (provider === undefined) throw new SyntaxError("Resolving undefined module");
        if (!(provider instanceof Function)) throw new TypeError("Trying to resolve non-module. Module must be a forge function.");
        var declaration = provider.toString().match(/^(function)?\s*[^\(]*\(\s*([^\)]*)\)/m);
        if (!(declaration)) throw new TypeError("Module must be defined with parenthesis around dependencies");
        var argstring = declaration[2].replace(/ /g, '');
        var deps;
        if (argstring !== '') {
            deps = argstring.split(',')
                .map(getResolved)
                .map(envelope => envelope.module);
        } else {
            deps = [];
        }
        return provider.apply(null, deps);
    }
    
    var diss = {
        resolve,
        require: requireWrapper,
        loadDependencies,
        loadProviders,
        register: {
            module: registerModule,
            provider: registerProvider
        },
    };
    return diss;
}
module.exports = dissForge;