var should = require('should');
var dissForge = require('../lib/diss.js');

describe('inject', function () {

    var diss;
    var noDeps, named, arrow, depends, dependsOnMore, dependsOnEvenMore, arrowDepends, circa, circb, circself, invalid;

    beforeEach(function () {
        diss = dissForge();
        
        noDeps = function () { return { mod: noDeps } },
        named = function name() { return { mod: named } },
        arrow = () => ({ mod: arrow });
        
        depends = function (noDeps) { return { mod:depends, dep:[noDeps] }; };
        dependsOnMore = function (noDeps, named, arrow) { return { mod:dependsOnMore, dep: [noDeps,named,arrow] } };
        dependsOnEvenMore = function (dependsOnMore) { return { mod: dependsOnEvenMore, dep: [dependsOnMore] }; };

        arrowDepends = (named) => ({mod:arrowDepends, dep:[named]});
        
        circa = function(circb) { return { mod: circb, dep:[circa]}; };
        circb = function(circa) { return { mod: circa, dep:[circb]}; };
        
        circself = function( circself ) { return { mod:circself, dep: [circself] } };
        
        invalid = function( nonexisting ) { return { mod:invalid, dep: [nonexisting] }};
    });

    describe('register', function() {
        describe('provider(name,provider)', function () {
            it("regiters anonymous function", function () {
                (function() { diss.register.provider('noDeps', noDeps); }).should.not.throw();
            });
            it("register.providers named function", function() {;
                (function() { diss.register.provider('named', named); }).should.not.throw();
            });
            it("register.providers fat arrow", function() {
                (function() { diss.register.provider('arrow', arrow); }).should.not.throw();
            });
            it("throws when registering non-provider as provider", function() {
                (function() { 
                    diss.register.provider('nonprovider',{} );
                }).should.throw(TypeError); 
            });
            it("throws TypeError if provider name is not a string", function() {
                (function() { 
                    diss.register.provider(123,{} );
                }).should.throw(TypeError);
            })
        });
        describe('module(name,module)', function() {
            it("allows to register a module", function() {
                (function() { diss.register.module('test',{}); }).should.not.throw();
            });
            it("throws TypeError if module name is not a string", function() {
                (function() { diss.register.module(123) }).should.throw();
            });
        });
    });
    describe('require(name,host)', function() {
        it("registers required file as module", function() {
            diss.require('./mock/require-test', module );
            diss.resolve(function(mockRequireTest) {
                should.exist( mockRequireTest );
                mockRequireTest.should.be.equal( require('./mock/require-test'));;
            });
        });
    });
    describe('loadDependencies(pkg,main)', function() {
       it("loads dependencies as modules from provided package.json object", function() {
           var pkg = { dependencies: { "mocha":"latest"}};
           diss.loadDependencies(pkg, module);
           diss.resolve(function(mocha) {
              mocha.should.be.equal(require('mocha')); 
           });
       });
       it("does nothing if there are no dependencies", function() {
            var pkg = {};
            (function() {
                diss.loadDependencies(pkg, module);
            }).should.not.throw();
       });
    });
    describe('loadProviders(providers,main,directory)', function() {
        it("loads providers from current directory", function() {
            diss.loadProviders(['test-provider-in-here'], module);
            diss.resolve(function(testProviderInHere) {
               should.exist(testProviderInHere);
            });
        });
        it("loads providers from specified directory", function() {
            diss.loadProviders(['test-provider-a','test-provider-b'], module, './mock');
            diss.resolve(function(testProviderA,testProviderB) {
               should.exist(testProviderA);
               should.exist(testProviderB);
               testProviderA.dep.should.be.equal(testProviderB); 
            });
        })
    });
    describe('resolve(module)', function() {
        it("resolves anonymous module without dependencies", function() {
            diss.resolve(noDeps).should.have.property('mod').which.is.equal(noDeps);
        });
        it("resolves named module without dependencies", function() {
            diss.resolve(named).should.have.property('mod').which.is.equal(named);
        });
        it("resolves arrow without dependencies", function() {
            diss.resolve(arrow).should.have.property('mod').which.is.equal(arrow); 
        });
        it("resolves dependency", function() {;
            diss.register.provider('noDeps',noDeps);
            diss.resolve(depends).should.have.property('mod').which.is.equal(depends);
            diss.resolve(depends).should.have.property('dep')
                    .which.has.property(0)
                    .which.has.property('mod')
                    .which.is.equal(noDeps);
        });
        it("resolves multiple dependencies", function() {
            diss.register.provider('noDeps',noDeps)
                .register.provider('named', named)
                .register.provider('arrow',arrow);
                
            var resolved = diss.resolve(dependsOnMore);
            resolved.should.have.property('mod').which.is.equal(dependsOnMore);
            
            [noDeps,named,arrow].forEach(function(f,idx) {
                resolved.dep[idx].should.have.property('mod').which.is.equal(f);
            });
        });
        it("resolves passing dependency", function() {
            diss.register.provider('noDeps',noDeps)
                .register.provider('named', named)
                .register.provider('arrow',arrow)
                .register.provider('dependsOnMore', dependsOnMore);
                
            var resolved = diss.resolve(dependsOnEvenMore);
            resolved.should.have.property('mod').which.is.equal(dependsOnEvenMore);
            resolved.dep[0].should.have.property('mod').which.is.equal(dependsOnMore);
            [noDeps,named,arrow].forEach(function(f,idx) {
                resolved.dep[0].dep[idx].should.have.property('mod').which.is.equal(f);
            });
        });
        it("resolves arrow function with dependencies", function() {
            diss.register.provider('named', named);
            var resolved = diss.resolve(arrowDepends);
            resolved.should.have.property('mod').which.is.equal(arrowDepends);
            resolved.dep[0].should.have.property('mod').which.is.equal(named);
        });
        it("should throw on circual dependency", function() {
            diss.register.provider('circa',circa)
                .register.provider('circb',circb);
            (function() { diss.resolve(circa); }).should.throw(SyntaxError);
        });
        it("should throw on circual self-dependency", function() {
            diss.register.provider('circself',circself);
            (function() { diss.resolve(circself); }).should.throw(SyntaxError);
        });
        it("should throw on non-existing dependency", function() {
            (function() { 
                diss.resolve(invalid) 
            }).should.throw(SyntaxError); 
        });
        it("resolves module depending on verbatim object", function() {
            var verbatim = {};
            diss.register.module('verbatim',verbatim);
            diss.resolve( function(verbatim) { return verbatim; } ).should.be.equal(verbatim);
        });
        it("throws TypeError wish function defined without parenthesis", function() {
            var test = {};
            diss.register.module('test',test);
            (function() {
                diss.resolve(test=>test)    
            }).should.throw(TypeError);
        });
        it("resolves provider using canonized name", function() {
            var tm = function( testToResolve ) { return testToResolve; },
                td = function() { return true; };
                
            diss.register.provider('test/to/resolve', td);
            diss.resolve(tm).should.be.equal(true);
        });
        it("throws SyntaxError when resolving unexinsting dependency", function() {
            (function() {
                diss.resolve(function(should) { })
            }).should.throw(/exist/);
        });
        it("throws TypeError when trying to resolve non-module", function() {
            (function() {
                diss.resolve({});
            }).should.throw(TypeError);
        });
        it("throws SyntaxError when trying to resolve undefined", function() {
            var u;
            (function() {
                diss.resolve(u);
            }).should.throw(SyntaxError);
        });
    });
});