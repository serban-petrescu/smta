function define(fnDefine) {
    "use strict";
    fnDefine(["./Request", "./Response"], ["./ErrorHandler"], function(Request, Response) {
        var oInvalidParameterError = {
                message: "Invalid parameters."  
            },
            fnToInt,
            fnToFloat,
            fnToBoolean,
            fnToObject,
            fnConvert,
            fnSetResponse;
        
        /**
         * Utility function for defining HTTP services. Allows request mapping based on method and query parameters.
         * @class
         * @param {object} oErrorHandler    An instance of the error handler.
         */
        function Service(oErrorHandler) {
            /** @protected @type {ErrorHandler} */
            this.oErrorHandler = oErrorHandler;
            
            /** @protected @type {object[]} */
            this.aMappings = [];
            
            /** @protected @type {function|null} */
            this.fnErrorResponseBuilder = null;
        }
        
        /**
         * Possible parameter types.
         * @enum {string}
         */
        Service.ParameterTypes = {
            String:     "string",
            Integer:    "integer",
            Float:      "float",
            Object:     "object",
            Boolean:    "boolean",
            ArrayBuffer: "buffer"
        };
        
        /**
         * Possible parameter sources.
         * @enum {string}
         */
        Service.ParameterSources = {
            QueryParameter: "query",
            RequestMethod:  "method",
            RequestBody:    "body",
            RequestHeader:  "header",
            RequestObject:  "request",
            ResponseObject: "response",
            EntityHeader:   "entity-header",
            Fixed:          "fixed"
        };
        
        /**
         * Convenience class for building mappings.
         * @class
         */
        function Mapping() {
            var oObject = {
                when: {
                    parameters: []
                },
                retrn: {
                    manage: false
                },
                parameters: []
            };
            
            /**
             * Sets the return type of the callback to be a response property object (@see Response#setProperties).
             * This is the default behavior. If nothing is returned by the callback, it is assumed that the callback 
             * set the properties of the response inside its logic.
             * @returns {object} this
             */
            this.returnProperties = function() {
                oObject.retrn.manage = false;
            };
            
            /**
             * Sets the return type of the callback to be a the body of the request (@see Response#setBody).
             * If the return value is an object, it will be transformed into JSON. If nothing is returned by 
             * the callback, it is assumed that the callback set the body of the response inside its logic.
             * @param   {int=}      iStatus         The HTTP status code.
             * @param   {string=}   sContentType    The content type of the body.
             * @param   {object=}   oHeaders        A map of headers.
             * @returns {object} this
             */
            this.returnBody = function(iStatus, sContentType, oHeaders) {
                if (typeof iStatus === "string") {
                    sContentType = iStatus;
                    iStatus = undefined;
                }
                else if (typeof iStatus === "object") {
                    oHeaders = iStatus;
                    sContentType = undefined;
                    iStatus = undefined;
                }
                if (typeof sContentType === "object") {
                    oHeaders = sContentType;
                    sContentType = undefined;
                }
                oObject.retrn = {
                    manage: true,
                    headers: oHeaders,
                    contentType: sContentType,
                    status: iStatus
                };
            };
            
            /**
             * Converts this instance to a plain object.\
             * @protected
             * @returns {object}    The plain object representation.
             */
            this.toPlainObject = function() {
                return oObject;
            };
            
            /**
             * Sets the expected request method.
             * @public
             * @param   {int=}  iMethod Can be used to specify the request method. If not given, all methods will ne mapped.
             * @returns {object} this
             */
            this.expectMethod = function(iMethod){
                oObject.when.method = iMethod;
                return this;
            };
            
            /**
             * Adds an expected parameter value (a parameter whose value is checked before mapping the request).
             * @public
             * @param   {string}    sParameter  The name of the parameter.
             * @param   {any}       oValue      The expected value of the parameter.
             * @returns {object} this
             */
            this.expectParameter = function(sParameter, oValue) {
                oObject.when.parameters.push({name: sParameter, value: oValue});
                return this;
            };
            
            /**
             * Adds a query parameter (which is read from the request, converted and passed to the handler).
             * @public
             * @param   {string=}   sName   The name of the parameter.
             * @param   {string=}   sType   The type of the parameter. Conversions will be done accordingly. 
             *                              @see Service#ParameterTypes.
             * @param   {any[]=}    aDomain Optional. A fixed list of allowed values can be specified.
             * @returns {object} this
             */
            this.passParameter = function(sName, sType, aDomain) {
                oObject.parameters.push({
                    source:     Service.ParameterSources.QueryParameter,
                    name:       sName,
                    type:       sType || "string",
                    domain:     aDomain
                });
                return this;
            };
            
            /**
             * Passes a fixed parameter to the handler
             * @public
             * @param   {any}       oValue  The value passed to the handler
             * @returns {object} this
             */
            this.passFixed = function(oValue) {
                oObject.parameters.push({
                    source:     Service.ParameterSources.Fixed,
                    value:      oValue
                });
                return this;
            };
            
            /**
             * Adds an optional query parameter (which is read from the request, converted and passed to the handler).
             * @public
             * @param   {string=}   sName    The name of the parameter.
             * @param   {string=}   sType    The type of the parameter. Conversions will be done accordingly. 
             *                               @see Service#ParameterTypes.
             * @param   {any[]=}    aDomain Optional. A fixed list of allowed values can be specified.
             * @param   {any=}      oDefault An optional default value.
             * @returns {object} this
             */
            this.passParameterOptional = function(sName, sType, aDomain, oDefault) {
                var oParam = {
                        source:     Service.ParameterSources.QueryParameter,
                        name:       sName,
                        type:       sType || "string"
                };
                if (aDomain !== undefined) {
                    if (aDomain instanceof Array) {
                        oParam.domain = aDomain;
                    }
                    else {
                        oDefault = aDomain;
                    }
                }
                if (oDefault !== undefined) {
                    oParam.implicit = oDefault;
                }
                else {
                    oParam.optional = true;
                }
                oObject.parameters.push(oParam);
                return this;
            };
            
            /**
             * Adds a header parameter (which is read from the request, converted and passed to the handler).
             * @public
             * @param   {integer}   iEntityIndex    The index of the entity.
             * @param   {string}    sName           The name of the parameter.
             * @param   {string=}   sType           The type of the parameter. Conversions will be done accordingly. 
             *                              @see Service#ParameterTypes.
             * @returns {object} this
             */
            this.passEntityHeader = function(iEntityIndex, sName, sType) {
                oObject.parameters.push({
                    source:     Service.ParameterSources.EntityHeader,
                    name:       sName,
                    entity:     iEntityIndex,
                    type:       sType || "string"
                });
                return this;
            };
            
            /**
             * Adds an optional header parameter (which is read from the request, converted and passed to the handler).
             * @public
             * @param   {integer}   iEntityIndex    The index of the entity.
             * @param   {string}    sName           The name of the parameter.
             * @param   {string=}   sType           The type of the parameter. Conversions will be done accordingly. 
             *                                      @see Service#ParameterTypes.
             * @param   {any=}      oDefault        An optional default value.
             * @returns {object} this
             */
            this.passEntityHeaderOptional = function(iEntityIndex, sName, sType, oDefault) {
                if (oDefault !== undefined) {
                    oObject.parameters.push({
                        source:     Service.ParameterSources.EntityHeader,
                        name:       sName,
                        entity:     iEntityIndex,
                        type:       sType || "string",
                        implicit:   oDefault
                    });
                }
                else {
                    oObject.parameters.push({
                        source:     Service.ParameterSources.EntityHeader,
                        name:       sName,
                        entity:     iEntityIndex,
                        type:       sType || "string",
                        optional:   true
                    });
                }
                return this;
            };
            
            /**
             * Adds a header parameter (which is read from the request, converted and passed to the handler).
             * @public
             * @param   {string=}   sName   The name of the parameter.
             * @param   {string=}   sType   The type of the parameter. Conversions will be done accordingly. 
             *                              @see Service#ParameterTypes.
             * @returns {object} this
             */
            this.passHeader = function(sName, sType) {
                oObject.parameters.push({
                    source:     Service.ParameterSources.RequestHeader,
                    name:       sName,
                    type:       sType || "string"
                });
                return this;
            };
            
            /**
             * Adds an optional header parameter (which is read from the request, converted and passed to the handler).
             * @public
             * @param   {string=}   sName    The name of the parameter.
             * @param   {string=}   sType    The type of the parameter. Conversions will be done accordingly. 
             *                               @see Service#ParameterTypes.
             * @param   {any=}      oDefault An optional default value.
             * @returns {object} this
             */
            this.passHeaderOptional = function(sName, sType, oDefault) {
                if (oDefault !== undefined) {
                    oObject.parameters.push({
                        source:     Service.ParameterSources.RequestHeader,
                        name:       sName,
                        type:       sType || "string",
                        implicit:   oDefault
                    });
                }
                else {
                    oObject.parameters.push({
                        source:     Service.ParameterSources.RequestHeader,
                        name:       sName,
                        type:       sType || "string",
                        optional:   true
                    });
                }
                return this;
            };
            
            /**
             * Adds the request body as a parameter (will be converted and passed to the handler).
             * @public
             * @param   {string=}   sType   The type of the parameter. Conversions will be done accordingly. 
             *                              @see Service#ParameterTypes.
             * @param   {int=}      iEntity Optionally, an entity of the body can be specified.
             * @returns {object} this
             */
            this.passBody = function(sType, iEntity) {
                if (iEntity !== undefined) {
                    oObject.parameters.push({
                        source:     Service.ParameterSources.RequestBody,
                        type:       sType || "string",
                        entity:     iEntity
                    });
                }
                else {
                    oObject.parameters.push({
                        source:     Service.ParameterSources.RequestBody,
                        type:       sType || "string"
                    });
                }
                return this;
            };
            
            /**
             * Adds the request entity as a parameter.
             * @public
             * @returns {object} this
             */
            this.passRequest = function() {
                oObject.parameters.push({source: Service.ParameterSources.RequestObject});
                return this;
            };
            
            /**
             * Adds the response entity as a parameter.
             * @public
             * @returns {object} this
             */
            this.passResponse = function() {
                oObject.parameters.push({source: Service.ParameterSources.ResponseObject});
                return this;
            }; 
            
            /**
             * Adds a "method"-sourced parameter to the parameter list (at the end).
             * @public
             * @returns {object} this
             */
            this.passMethod = function() {
                oObject.parameters.push({
                    source:     Service.ParameterSources.RequestMethod,
                    type:       "integer"
                });
                return this;
            };
            
            /**
             * Sets the callback for the mapping.
             * @public
             * @param   {function}  fnMethod    The callback which will process the request.
             * @param   {object=}   oHandler    An optional object upon which the callbed will be issued.
             * @returns {object} this
             */
            this.callback = function(fnMethod, oHandler) {
                oObject.callback = fnMethod;
                if (typeof oHandler === "object") {
                    oObject.handler = oHandler;
                }
                return this;
            };
        }
        
        /**
         * Builds a new mapping.
         * @returns {Mapping} A new mapping instance.
         */
        Service.prototype.createMapping = function() {
            var oMapping = new Mapping();
            this.aMappings.push(oMapping);
            return oMapping;
        };
        
        /**
         * Registers a custom error response builder. Only one can exists at a time.
         * @public
         * @param   {function}  fnMethod    The callback which should create a response in case of error. 
         *                                  Can take two parameters: {string} sError and {Response} oResponse.
         *                                  May return an object with the response properties (@see Response#setProperties).
         * @param   {object=}   oObject     An optional object upon which the callbed will be issued.
         * @returns {object} this
         */
        Service.prototype.error = function(fnMethod, oObject) {
            if (typeof fnMethod === "function") {
                oObject = oObject || null;
                this.fnErrorResponseBuilder = fnMethod.bind(oObject);
            }
            else {
                this.fnErrorResponseBuilder = null;
            }
            return this;
        };
        
        /**
         * Check if a request should be handled by the current mapping.
         * @protected
         * @param {object}  oWhen       The "when" property of the current mapping.
         * @param {object}  oRequest    The request object.
         * @returns {boolean}   True if the request should be handled by the current mapping.
         */
        Service.prototype.check = function(oWhen, oRequest) {
            var i, sValue, sExpected;
            if (oWhen.hasOwnProperty("method")) {
                if (oWhen.method !== oRequest.getMethod()) {
                    return false;
                }
            }
            if (oWhen.hasOwnProperty("parameters") && oWhen.parameters && oWhen.parameters.length) {
                for (i = 0; i < oWhen.parameters.length; ++i) {
                    if (typeof oWhen.parameters[i].value === "string") {
                        sExpected = oWhen.parameters[i].value;
                    }
                    else {
                        sExpected = oWhen.parameters[i].value.toString();
                    }
                    sValue = oRequest.getParameter(oWhen.parameters[i].name);
                    if (sValue !== sExpected) {
                        return false;
                    }
                }
            }
            return true;
        };
        
        /**
         * Helper conversion function
         * @param {string} sValue The value (string).
         * @returns {int}  The converted value.
         */
        fnToInt = function(sValue) {
            if (isNaN(sValue)) {
                throw oInvalidParameterError;
            }
            else {
                return parseInt(sValue, 10);
            }
        };
        
        /**
         * Helper conversion function
         * @param {string} sValue The value (string).
         * @returns {float}  The converted value.
         */
        fnToFloat = function(sValue) {
            if (isNaN(sValue)) {
                throw oInvalidParameterError;
            }
            else {
                return parseFloat(sValue);
            }
        };
        
        /**
         * Helper conversion function
         * @param {string} sValue The value (string).
         * @returns {boolean}  The converted value.
         */
        fnToBoolean = function(sValue) {
            if (typeof sValue === "boolean") {
                return sValue;
            }
            if (sValue !== "true" && sValue !== "false") {
                throw oInvalidParameterError;
            }
            else {
                return sValue === "true";
            }
        };
        
        /**
         * Helper conversion function
         * @param {string} sValue The value (string).
         * @returns {object}  The converted value.
         */
        fnToObject = function(sValue) {
            try {
                return JSON.parse(sValue);
            }
            catch(e) {
                throw oInvalidParameterError;
            }
        };
        
        /**
         * Helper conversion function
         * @param {object}  oSpec   The specification / configuration for the value.
         * @param {any}     oValue  The value.
         * @returns {any}  The converted value.
         */
        fnConvert = function(oSpec, oValue) {
            if (oValue === undefined) {
                if (oSpec.hasOwnProperty("implicit")) {
                    oValue = oSpec.implicit;
                }
                else if (oSpec.optional) {
                    return undefined;
                }
                else {
                    throw oInvalidParameterError;
                }
            }
            switch(oSpec.type) {
                case Service.ParameterTypes.Integer:
                    oValue = fnToInt(oValue);
                    break;
                case Service.ParameterTypes.Float:
                    oValue = fnToFloat(oValue);
                    break;
                case Service.ParameterTypes.Boolean:
                    oValue = fnToBoolean(oValue);
                    break;
                case Service.ParameterTypes.Object:
                    oValue = fnToObject(oValue);
                    break;
            }
            return oValue;
        };
        
        /**
         * Gets the parameters from the request.
         * @protected
         * @param {object[]}    aSpecs      The mapping parameter specification.
         * @param {Request}     oRequest    The request object.
         * @param {Response}    oResponse   The response object.
         * @returns {any[]}     An array of parameter values (positions are identical / correspond to the order in the spec).
         */
        Service.prototype.getParameters = function(aSpecs, oRequest, oResponse) {
            var oValue, i, aResult = [], bSkipConversion;
            
            for (i = 0; i < aSpecs.length; ++i) {
                bSkipConversion = false;
                switch (aSpecs[i].source) {
                    case Service.ParameterSources.RequestMethod:
                        oValue = oRequest.getMethod().toString();
                        break;
                    case Service.ParameterSources.RequestBody:
                        if (aSpecs[i].type === Service.ParameterTypes.ArrayBuffer) {
                            oValue = oRequest.getBodyAsArrayBuffer(aSpecs[i].entity);
                            bSkipConversion = true;
                        }
                        else {
                            oValue = oRequest.getBodyAsString(aSpecs[i].entity);
                        }
                        break;
                    case Service.ParameterSources.RequestHeader:
                        oValue = oRequest.getHeader(aSpecs[i].name);
                        break;
                    case Service.ParameterSources.EntityHeader:
                        oValue = oRequest.getEntityHeader(aSpecs[i].entity, aSpecs[i].name);
                        break;
                    case Service.ParameterSources.RequestObject:
                        oValue = oRequest;
                        bSkipConversion = true;
                        break;
                    case Service.ParameterSources.ResponseObject:
                        oValue = oResponse;
                        bSkipConversion = true;
                        break;
                    case Service.ParameterSources.Fixed:
                        oValue = aSpecs[i].value;
                        bSkipConversion = true;
                        break;
                    default:
                        oValue = oRequest.getParameter(aSpecs[i].name);
                        break;
                }
                
                if (!bSkipConversion) {
                    try {
                        oValue = fnConvert(aSpecs[i], oValue);
                    }
                    catch(e) {
                        oValue = undefined;
                        this.oErrorHandler.onError(e);
                    }
                }
                
                if (aSpecs[i].domain && aSpecs[i].domain.indexOf(oValue) === -1) {
                    this.oErrorHandler.onError(oInvalidParameterError);
                }
                
                aResult.push(oValue);
                
            }
            
            return aResult;
        };
        
        /**
         * Sets the response properties using the result of the callback adn the configuration.
         * @param {any}         oResult     The result of the callback.
         * @param {object}      oMapping    The plain object representation of the mapping.
         * @param {Response}    oResponse   The response object.
         * @returns {void}
         */
        fnSetResponse = function(oResult, oMapping, oResponse) {
            if (oMapping.retrn.manage) {
                var oProperties = {
                    status: oMapping.retrn.status ||  (oResult !== undefined ? 
                        Response.StatusCodes.Ok : Response.StatusCodes.NoContent),
                    contentType: oMapping.retrn.contentType ||  (typeof oResult === "object" ? 
                        Response.ContentTypes.ApplicationJson : Response.ContentTypes.TextPlain),
                    body: (typeof oResult === "object" ? JSON.stringify(oResult) : oResult),
                    headers: oMapping.headers
                };
                if (oProperties.status === Response.StatusCodes.NoContent && oProperties.hasOwnProperty("body")) {
                    delete oProperties.body;
                }
                oResponse.setProperties(oProperties);
            }
            else {
                if (typeof oResult === "object") {
                    oResponse.setProperties(oResult);
                }
            }
        };
        
        /**
         * Handles a request and creates a response.
         * @public
         * @param {object}  oNativeRequest  The native request object.
         * @param {object}  oNativeResponse The native response object.
         * @returns {object} this
         */
        Service.prototype.execute = function(oNativeRequest, oNativeResponse) {
            var oRequest  = new Request(oNativeRequest),
                oResponse = new Response(oNativeResponse),
                i,
                bMapped = false,
                oResult,
                aParams,
                oMapping;
            try {
                this.oErrorHandler.onInit();
                
                for (i = 0; i < this.aMappings.length; ++i) {
                    oMapping = this.aMappings[i].toPlainObject();
                    if (oMapping.when && this.check(oMapping.when, oRequest)) {
                        bMapped = true;
                        aParams = this.getParameters(oMapping.parameters, oRequest, oResponse);
                        oResult = oMapping.callback.apply(oMapping.handler, aParams);
                        fnSetResponse(oResult, oMapping, oResponse);
                        break;
                    }
                }
                
                if (!bMapped) {
                    this.oErrorHandler.onError(oInvalidParameterError);
                }
                
                this.oErrorHandler.onExit();
            }
            catch(e) {
                var sError = this.oErrorHandler.stringifyError(e);
                if (typeof this.fnErrorResponseBuilder === "function") {
                    oResult = this.fnErrorResponseBuilder(sError, oResponse);
                    if (typeof oResult === "object") {
                        oResponse.setProperties(oResult);
                    }
                }
                else {
                    oResponse.setProperties({
                        status:         Response.StatusCodes.BadRequest,
                        contentType:    Response.ContentTypes.TextPlain,
                        body:           sError
                    });
                }
            }
            return this;
        };
        
        return Service;
    });
}