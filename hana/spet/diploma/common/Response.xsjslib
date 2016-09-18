function define(fnDefine) {
    "use strict";
    fnDefine(function() {
        /**
         * Wrapper class for native HTTP Response. This class should be used to aid in the technology decoupling (it can be adapted to
         * be used with several different native response objects).
         * @class
         * @param {object} oNativeResponse The native response object.
         */
        function Response(oNativeResponse) {
            /** @protected */
            this.nativeResponse = oNativeResponse;
        }
        
        /**
         * Sets the content (MIME) type of the response.
         * @public
         * @param {string}  sContentType The MIME type.
         * @returns {object} this
         */
        Response.prototype.setContentType = function(sContentType) {
            this.nativeResponse.contentType = sContentType;
            return this;
        };
        
        /**
         * Sets the follow up object (async request completion).
         * @param   {object}  oFollowUp  The follow up object.
         * @returns {void}
         */
        Response.prototype.setFollowUp = function(oFollowUp) {
            this.nativeResponse.followUp(oFollowUp);
        };
        
        /**
         * Sets the status code of the response.
         * @public
         * @param {int}  iStatus The HTTP status code.
         * @returns {object} this
         */
        Response.prototype.setStatus = function(iStatus) {
            this.nativeResponse.status = iStatus;
            return this;
        };
        
        /**
         * Sets the body of the response.
         * @public
         * @param {any}  oBody The body. Prefferably a string. The exact allowed types of object depend on the native response object.
         * @returns {object} this
         */
        Response.prototype.setBody = function(oBody) {
            this.nativeResponse.setBody(oBody);
            return this;
        };
        
        /**
         * Sets a header.
         * @public
         * @param {string}  sHeader The header name.
         * @param {string}  sValue  The header value.
         * @returns {object} this
         */
        Response.prototype.setHeader = function(sHeader, sValue) {
            this.nativeResponse.headers.set(sHeader, sValue);
            return this;
        };
        
        /**
         * Conveninence method for calling all the other setters.
         * @public
         * @param {object}  oProperties             The properties of the request.
         * @param {int=}    oProperties.status      The HTTP status code.
         * @param {string=} oProperties.contentType The content (MIME) type.
         * @param {object=} oProperties.headers     An object for the headers (key = header name, value = header value).
         * @param {any=}    oProperties.body        The response body.
         * @returns {object} this
         */
        Response.prototype.setProperties = function(oProperties) {
            var sHeader;
            if (typeof oProperties !== "object") {
                return this;
            }
            if (oProperties.hasOwnProperty("status") && oProperties.status !== undefined) {
                this.setStatus(parseInt(oProperties.status, 10));
            }
            if (oProperties.hasOwnProperty("contentType") && oProperties.contentType !== undefined) {
                this.setContentType(oProperties.contentType);
            }
            if (oProperties.hasOwnProperty("headers") && oProperties.headers !== undefined) {
                for (sHeader in oProperties.headers) {
                    if (oProperties.headers.hasOwnProperty(sHeader)) {
                        this.setHeader(sHeader, oProperties.headers[sHeader]);
                    }
                }
            }
            if (oProperties.hasOwnProperty("body") && oProperties.body !== undefined) {
                this.setBody(oProperties.body);
            }
            if (oProperties.hasOwnProperty("followUp") && typeof oProperties.followUp === "object") {
                this.setFollowUp(oProperties.followUp);
            }
            return this;
        };
        
        /**
         * Non-exhaustive list of commonly used MIME types.
         * @enum {string}
         */
        Response.ContentTypes = {
            ApplicationJson:    "application/json",
            ApplicationXml:     "application/xml",
            ApplicationZip:     "application/zip",
            TextCsv:            "text/csv",
            TextHtml:           "text/html",
            TextPlain:          "text/plain",
            TextXml:            "text/xml"
        };
         
        /**
         * Non-exhaustive list of commonly used HTTP status codes.
         * @enum {int}
         */
        Response.StatusCodes = {
            Ok:                 200,
            Created:            201,
            Accepted:           202,
            NoContent:          204,
            BadRequest:	        400,
            Unauthorized:	    401,
            Forbidden:          403,
            NotFound:           404,
            MethodNotAllowed:   405,
            InternalServerError:500,
            NotYetImplemented:  501
        };
        
        return Response;
    });
}