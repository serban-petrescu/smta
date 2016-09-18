var sandbox = (function(){
    "use strict";
    var oLoadedModules = {},
        fnResolve,
        fnDefine,
        fnGetInstance,
        fnCleanConfig,
        fnImmediate,
        aLoadStack = [],
        aInstStack = [];
    
    /**
     * Represents a source file. Each source file should contain only one module.
     * @private
     * @class File
     * @param {string}  sPath    The absolute or relative path of the file (relative paths start with "./").
     * @param {object=} oOrigin  The origin file (only relevant for relative paths).
     */	
     function File(sPath, oOrigin) {
        var aParts,
            sFile,
			i;
        if (oOrigin && sPath.indexOf("./") === 0) {
            sPath = oOrigin.folder + sPath.substring(1);
        }
        aParts = sPath.split("/");
		for (i = 1; i < aParts.length; ++i) {
			if (aParts[i] === ".." && i > 0) {
				aParts.splice(i - 1, 2);
				i -= 2;
			}
		}
        sFile  = aParts.pop();
        this.folder = aParts.join("/");
        this.pkg    = aParts.join(".");
        this.name   = sFile;
        this.path   = this.folder + "/" + this.name;
        this.load = function() {
            return $.import(this.pkg, this.name);
        };
    }
    
    /**
     * Resolves a given module.
     * @private
     * @param {string}  sPath    The absolute or relative path of the file.
     * @param {object=} oOrigin  The origin file (only relevant for relative paths).
     * @returns {object} The module information.
     * @property {File}     return.file     The file object of the module.
     * @property {object}   return.config   A configuration object.
     * @property {boolean}  return.config.factory   Shows if the module is a factory function.
     * @property {boolean}  return.config.construct Shows if the module is a contructor / class.
     * @property {boolean}  return.config.constant  Shows if the module is a plain object (with constants, functions, etc).
     * @property {string[]} return.config.args      Optional. Instance dependencies (instances which will be passed to the constructor / factory).
     * @property {string[]} return.config.params    Optional. Instance creation extra parameters (@see sandbox#setParams).
     * @property {boolean}  return.config.singleton Marks the "class" as being singleton --> Instances will be reused.
     */
    fnResolve = function(sPath, oOrigin) {
        var oFile = new File(sPath, oOrigin),
            oResult,
            oScope;
        if (oLoadedModules[oFile.path]) {
            return oLoadedModules[oFile.path];
        }
        oScope = oFile.load();
        
        if (typeof oScope.define === "function") {
            oResult = {
                file:   oFile
            };
            oLoadedModules[oFile.path] = oResult;
            oScope.define(fnDefine.bind(this, oFile));
            return oResult;
        }
        else if (typeof oScope.immediate === "function") {
            oResult = {
                file:   oFile
            };
            oLoadedModules[oFile.path] = oResult;
            oScope.immediate(fnImmediate.bind(this, oFile));
            return oResult;
        }
        else {
            oResult = {
                module: oScope,
                file:   oFile,
                config: {
                    constant:   true,
                    factory:    false,
                    construct:  false
                }
            };
            oLoadedModules[oFile.path] = oResult;
            return oResult;
        }
    };
    
    /**
     * Defines a module.
     * @see sandbox#define
     * @private
     * @param {object}              oFile           A file object for the module's file.
     * @param {string[]}            aDependencies   Optional. An array of paths to dependencies. 
     * @param {object|string[]=}    oConfig         A configuration object or directly the args property (the rest of the properties are inferred).
     * @param {function}            fnDefiner       The scoping / definign function. Should build and return the module itself. 
     * @returns {void}
     */
    fnDefine = function(oFile, aDependencies, oConfig, fnDefiner) {
        var aModules = [],
            i, oModule;
        if (typeof aDependencies === "function") {
            fnDefiner = aDependencies;
            aDependencies = [];
            oConfig   = {};
        }
        else if (typeof oConfig === "function") {
            fnDefiner = oConfig;
            oConfig   = {};
        }
        else if (oConfig.length) {
            oConfig = {args: oConfig};
        }
        
        if (aLoadStack.indexOf(oFile.path) >= 0) {
            throw {
                message: "Circular dependency reference."
            };
        }
        
        aLoadStack.push(oFile.path);
        for (i = 0; i < aDependencies.length; ++i) {
            aModules.push(fnResolve(aDependencies[i], oFile).module);
        }
        aLoadStack.pop();
        
        oModule = fnDefiner.apply(null, aModules);
        oLoadedModules[oFile.path].module = oModule;
        oLoadedModules[oFile.path].config = fnCleanConfig(oConfig, typeof oModule, oFile.name);
    };
    
    /**
     * Cleans the configuration passed by the caller and infers missing parameters.  
     * @private
     * @see sandbox#define
     * @param   {object}    oConfig     The "raw" configuration object.
     * @param   {string}    sModuleType The typeof result for the module.
     * @param   {string}    sFileName   The module's file name.
     * @returns {object}    The clean config object.
     */
    fnCleanConfig = function(oConfig, sModuleType, sFileName) {
        var oNew = {
            constant:   oConfig.constant  || false,
            factory:    oConfig.factory   || false,
            construct:  oConfig.construct || false,
            singleton:  oConfig.singleton || false
        };
        if (!oNew.constant && !oNew.factory && !oNew.construct) {
            if (sModuleType === "object") {
                oNew.constant = true;
            }
            else if (sModuleType === "function"){
                if (sFileName.charAt(0) >= "A"  && sFileName.charAt(0) <= "Z") {
                    oNew.construct = true;
                }
                else {
                    oNew.factory = true;
                }
            }
        }
        if (!oConfig.constant && typeof oConfig.args === "object" && oConfig.args.length) {
            oNew.args = oConfig.args;
        }
        return oNew;
    };
    
    /**
     * Creates an immediate module. Can be either named or annonymous.
     * @private
     * @param {File=}       oFile           A File object (only used in case the module is named).
     * @param {string[]}    aDependencies   Optional. An array of module dependencies.
     * @param {string[]}    aInstances      Optional. An array of instance dependencies.
     * @param {function}    fnDefiner       The scoping function which builds the module.
     * @returns {object}    The module itself.
     */
    fnImmediate = function(oFile, aDependencies, aInstances, fnDefiner) {
        var aParameters = [], i, oModule;
        
        if (typeof aDependencies === "function") {
            fnDefiner = aDependencies;
            aDependencies = [];
            aInstances = [];
        }
        else if (typeof aInstances === "function") {
            fnDefiner = aInstances;
            aInstances = [];
        }
        
        if (oFile) {
            if (aLoadStack.indexOf(oFile.path) >= 0) {
                throw {
                    message: "Circular dependency reference."
                };
            }
            aLoadStack.push(oFile.path);
        }
        
        for (i = 0; i < aDependencies.length; ++i) {
            aParameters.push(fnResolve(aDependencies[i], oFile).module);
        } 
        for (i = 0; i < aInstances.length; ++i) {
            aParameters.push(fnGetInstance(aInstances[i], oFile));
        } 
        oModule = fnDefiner.apply(null, aParameters);
        
        if (oFile) {
            oLoadedModules[oFile.path].module = oModule;
            oLoadedModules[oFile.path].config = {
                constant:   true,
                factory:    false,
                construct:  false
            };
        }
        return oModule;
    };
    
    /**
     * Builds and retrieves an instance of a module. If the module is a singleton and an instance was already created, the old instance is returned.
     * @private
     * @param {string}  sPath    The absolute or relative path of the file (navigating upwards is not supported; marks the current folder).
     * @param {object=} oOrigin  The origin file (only relevant for relative paths).
     * @param {any[]=}  aExtra   An array of extra parameters to be passed to the constructor / factory.
     * @returns {object}    The instance.
     */
    fnGetInstance = function(sPath, oOrigin, aExtra) {
        var oModule = fnResolve(sPath, oOrigin),
            aDepArgs,
            aInstArgs = [],
            oInstance,
            i;
        if (oModule.config.constant) {
            return oModule.module;
        }
        else {
            if (oModule.config.singleton && oModule.instance) {
                return oModule.instance;
            }
            aExtra = aExtra || oModule.params || [];
            if (aInstStack.indexOf(oModule.file.path) >= 0) {
                throw {
                    message: "Circular dependency reference."
                };
            }
            aInstStack.push(oModule.file.path);
            aDepArgs = oModule.config.args || [];
            for (i = 0; i < aDepArgs.length; ++i) {
                aInstArgs.push(fnGetInstance(aDepArgs[i], oModule.file));
            } 
            aInstStack.pop();
            if (oModule.config.factory) {
                oInstance = oModule.module.apply(null, aInstArgs.concat(aExtra));
            }
            else {
                oInstance = new (Function.prototype.bind.apply(oModule.module, [null].concat(aInstArgs,aExtra)));
            }
            
            if (oModule.config.singleton) {
                oModule.instance = oInstance;
            }
            
            return oInstance;
        }
    };
    
    return {
        
        /**
         * Defines a module.
         * @public
         * @param {string}              sPath           The absolute path to the module file.
         * @param {string[]}            aDependencies   An array of paths to dependencies. 
         * @param {object|string[]=}    oConfig         A configuration object or directly the args property (the rest of the properties are inferred).
         * @property {boolean}          oConfig.factory   Shows if the module is a factory function.
         * @property {boolean}          oConfig.construct Shows if the module is a contructor / class.
         * @property {boolean}          oConfig.constant  Shows if the module is a plain object (with constants, functions, etc).
         * @property {boolean}          oConfig.singleton Shows if the module is a singleton class.
         * @property {string[]}         oConfig.args      Optional. Instance dependencies (instances which will be passed to the constructor / factory)
         * @param {function}            fnDefiner       The scoping / definign function. Should build and return the module itself. 
         * @returns {object} this
         */
        define: function(sPath, aDependencies, oConfig, fnDefiner) {
            var oFile = new File(sPath);
            if (!oLoadedModules[oFile.path]) {
                oLoadedModules[oFile.path] = {
                    file: oFile
                };
            }
            fnDefine(oFile, aDependencies, oConfig, fnDefiner);
            return this;
        },
        
        /**
         * Defines an annonymous module. 
         * @public
         * @param {string[]}    aDependencies   Optional. An array of paths to dependencies which should be loaded. 
         * @param {string[]}    aInstances      Optional. An array of paths to dependencies which should be instantiated. 
         * @param {function}    fnDefiner       The scoping / definign function. Should build and return the module itself.
         *                                      Will receive as parameters, in order, the requested dependencies and instances.
         * @returns {any}   The return value obtained from calling the fnDefiner function.
         */
        immediate: function(aDependencies, aInstances, fnDefiner) {
            return fnImmediate(null, aDependencies, aInstances, fnDefiner);
        },
        
        /**
         * Retrieves an instance of a module
         * @public
         * @param {string}  sPath  The absolute path to the module file.
         * @returns {object} The instance of the module.
         */
        getInstance: function(sPath) {
            return fnGetInstance(sPath, null, Array.prototype.slice.call(arguments, 1));
        },
        
        /**
         * Sets the instance of the module (will be then used for further module instantiations). Only relevant for singletons.
         * @public
         * @param {string}  sPath       The absolute path to the module file.
         * @param {object}  oInstance   The instance.
         * @returns {object} this
         */
        setInstance: function(sPath, oInstance) {
            var oModule = fnResolve(sPath);
            if (oModule.config.singleton) {
                oModule.instance = oInstance;
            }
            return this;
        },
        
        /**
         * Sets the extra parameters for future instantiations of a module.
         * @public
         * @param {string}  sPath       The absolute path to the module file.
         * @param {...any}  aExtra      Extra parameters.
         * @returns {object} this
         */
        setParams: function(sPath) {
            fnResolve(sPath).params = Array.prototype.slice.call(arguments, 1);
            return this;
        }
    };
}())
.define("$/hdb/Connection", [], {factory: true, singleton: true}, function() {
    
    /**
     * Helper / wrapper pseudo-module for databse connections (HDB interface).
     * @see $.hdb#getConnection
     * @param   {object=}   oOptions    Connection parameters. 
     * @returns {Connection}    A HDB connection.
     */
    return function(oOptions){
        if (oOptions) {
            return $.hdb.getConnection(oOptions);
        }
        else {
            return $.hdb.getConnection();
        }
    };
    
});