function define(fnDefine) {
    "use strict";
    fnDefine([], {singleton: true}, function(){
        /**
         * Helper class for handling errors.
         * @class
         * @public
         * @param {int=} iStrategy   The strategy which should be initially used to handle errors.
         */
        function ErrorHandler(iStrategy) {
            var fnAbort,
                fnStringifyError,
                fnAppend,
                iCurrentStrategy = iStrategy || ErrorHandler.defaultStrategy,
                bIgnore,
                aErrors;
            
            /**
             * Helper function for transforming an exception to a string.
             * @private
             * @param {exception} e The exception object.
             * @returns {string} A string representing the error.
             */
            fnStringifyError = function(e) {
                if (typeof e === "string") {
                    return e;
                }
                if (e && typeof e.message === "string") {
                    return e.message;
                }
                return JSON.stringify(e);
            };
            
            /**
             * Helper function implementing the "Abort" strategy (rethrows the exception).
             * @private
             * @param {exception} e The exception object.
             * @returns {void}
             */
            fnAbort = function(e) {
                throw e;
            };
            
            /**
             * Helper function implementing the "Append" strategy (saves the exception in an array).
             * @private
             * @param {exception} e The exception object.
             * @returns {void}
             */
            fnAppend = function(e) {
                aErrors.push(e);
            };
            
            /**
             * Initialization function. Can be called multiple times during an execution.
             * @public
             * @returns {object} this
             */
            this.onInit = function() {
                aErrors = [];
                bIgnore = false;
                return this;
            };
            
            /**
             * Cleanup function. Will thrown an error if there are saved errors in the internal error array.
             * @public
             * @returns {object} this
             */
            this.onExit = function() {
                if (aErrors.length) {
                    throw aErrors.join(" ");
                }
                return this;
            };
            
            /**
             * Error handling function. Will apply the selected strategy(s) depending on the strategy value.
             * Multiple strategies can be selected by using the bitwise or operation.
             * @public
             * @param {exception} e The exception object.
             * @returns {object} this
             */
            this.onError = function(e) {
                if (bIgnore) {
                    return this;
                }
                e = fnStringifyError(e);
                if (iCurrentStrategy & ErrorHandler.Strategies.Append) {
                    fnAppend(e);
                }
                if (iCurrentStrategy & ErrorHandler.Strategies.Abort) {
                    fnAbort(e);
                }
                return this;
            };
            
            /**
             * Toggles between ignoring errors and applying the error-handling strategy.
             * @public
             * @returns {boolean} The new value for the ignore flag (true = hide errors, false = handle errors).
             */
            this.toggleHideErrors = function() {
                bIgnore = !bIgnore;
                return bIgnore;
            };
            
            /**
             * Sets the strategy which should be used for handling errors.
             * @public
             * @param {int} iNewStrat   The new strategy value (either one of the values in the Strategy enum or an OR between them).
             * @returns {object} this
             */
            this.setStrategy = function(iNewStrat) {
                iCurrentStrategy = parseInt(iNewStrat, 10) || ErrorHandler.defaultStrategy;
                return this;
            };
            
            /** @public @see fnStringifyError */
            this.stringifyError = fnStringifyError;
        }
        
        /**
         * Strategies available for error-handling.
         * @enum {int} 
         */
        ErrorHandler.Strategies = {
            /** Rethrows the error --> control flow show eventually reach the top-level try-catch. */
            Abort:      1,
            /** Appends each error to an array. At the end of execution, the array is joined into a string and thrown.*/
            Append:     2,
            /** Does nothing, simply ignoring errors. */
            Ignore:     4
        };
        
        /**
         * The default strategy is the abort strategy. This is used when the given strategy is falsy.
         * @static
         * @type {int}
         */
        ErrorHandler.defaultStrategy = ErrorHandler.Strategies.Abort;
        
        return ErrorHandler;
    });
}