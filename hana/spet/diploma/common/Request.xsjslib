function define(fnDefine) {
    "use strict";
    fnDefine(function() {
        
        /**
         * Wrapper class for native HTTP Request. This class should be used to aid in the technology decoupling (it can be adapted to
         * be used with several different native request objects).
         * @class
         * @param {object} oNativeRequest The native request object.
         */
        function Request(oNativeRequest) {
            this.nativeRequest = oNativeRequest;
        }
        
        /**
         * Returns the HTTP method used.
         * @public
         * @returns {int} Http method. 
         * @see Request#Methods
         */
        Request.prototype.getMethod = function() {
            return this.nativeRequest.method;
        };
        
        /**
         * Returns the path (relative to the host) of the script on which the request was done.
         * @public
         * @returns {string} The request path.
         */
        Request.prototype.getPath = function() {
            return this.nativeRequest.path;
        };
        
        /**
         * Returns the query path (path portion after the script and before the query params).
         * @public
         * @returns {string} The query path.
         */
        Request.prototype.getQueryPath = function() {
            return this.nativeRequest.queryPath;
        };
        
        /**
         * Returns a query parameter.
         * @public
         * @param {string} sParam The name of the parameter.
         * @returns {string} The value of the parameter (or undefined if not found).
         */
        Request.prototype.getParameter = function(sParam) {
            return this.nativeRequest.parameters.get(sParam);
        };
        
        /**
         * Returns the value of a header.
         * @public
         * @param {string} sHeader The name of the header.
         * @returns {string} The value of the header (or undefined if not found).
         */
        Request.prototype.getHeader = function(sHeader) {
            return this.nativeRequest.headers.get(sHeader);
        };
        
        /**
         * Returns the value of a header.
         * @public
         * @param {int}     iEntityIndex The index of the sub entity. If not given, the body of the whole request is returned.
         * @param {string}  sHeader      The name of the header.
         * @returns {string} The value of the header (or undefined if not found).
         */
        Request.prototype.getEntityHeader = function(iEntityIndex, sHeader) {
            if (!this.nativeRequest.entities[iEntityIndex]) {
                return undefined;
            }
            else {
                return this.nativeRequest.entities[iEntityIndex].headers.get(sHeader);
            }
        };
        
        /**
         * Returns the request (or a sub entity's) body as a string.
         * @public
         * @param {int=} iEntityIndex The index of the sub entity. If not given, the body of the whole request is returned.
         * @returns {string} A string representation of the body.
         */
        Request.prototype.getBodyAsString = function(iEntityIndex) {
            var oBody = isNaN(iEntityIndex) ? this.nativeRequest.body : this.nativeRequest.entities[iEntityIndex].body;
            if (oBody !== undefined) {
                return oBody.asString();
            }
            else {
                return undefined;
            }
        };
        
        /**
         * Returns the request (or a sub entity's) body as an ArrayBuffer.
         * @public
         * @param {int=} iEntityIndex The index of the sub entity. If not given, the body of the whole request is returned.
         * @returns {ArrayBuffer} An ArrayBuffer representation of the body.
         */
        Request.prototype.getBodyAsArrayBuffer = function(iEntityIndex) {
            var oBody = isNaN(iEntityIndex) ? this.nativeRequest.body : this.nativeRequest.entities[iEntityIndex].body;
            if (oBody !== undefined) {
                return oBody.asArrayBuffer();
            }
            else {
                return undefined;
            }
        };
        
        /**
         * Returns the number of subentities of the request.
         * @public
         * @returns {int} The number of entities.
         */
        Request.prototype.getEntityCount = function() {
            return this.nativeRequest.entities.length;
        };
        
        /**
         * Possible HTTP methods.
         * @enum {int}
         */
        Request.Methods = {
            Options:	0,
            Get:	    1,
            Head:       2,
            Post:		3,
            Put:	    4,
            Delete:	    5,
            Trace:      6,
            Connect:    7,
            Patch:      8
        };
        
        return Request;
    });
}