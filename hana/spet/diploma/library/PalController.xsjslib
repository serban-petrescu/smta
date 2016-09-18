function define(fnDefine) {
    "use strict";
	fnDefine([
	        "./constants",
	        "./PalHelper",
	        "./../common/dbUtils",
	        "./../common/miscUtils" 
	    ],[
	        "$/hdb/Connection", 
	        "./../common/ErrorHandler"
	    ], 
	    function(oConst, oHelper, oDB, oMU) {
	        var fnGetInput,
	            fnGetExec,
	            fnCreateAndRunPal;
	        
	        /**
	         * Creates, runs and eventaully drops a PAL procedure.
	         * @private
	         * @param   {string}    sName   The name of the PAl algorithm.
	         * @param   {object[]}  oData   The input data for the algorithm.
	         * @param   {object}    oParams The parameters for the control table.
	         * @returns {object}    The result of the PAL algorithm call.
	         */
	        fnCreateAndRunPal = function(sName, oData, oParams) {
    	        try {
                    var sProcedure =  "P" + $.util.createUuid(),
                        oResult;
                    oDB.callProcedure(oConst.Schemas.Main, oConst.Procedures.AflWrapperCreate, 'AFLPAL' ,sName, 
                        oConst.Schemas.Main, sProcedure, oHelper.getSignature(sName));
                    oResult = oDB.callProcedure(oConst.Schemas.Main, sProcedure, oData, 
                        oHelper.getControl(sName, oParams));
                    oDB.callProcedure(oConst.Schemas.Main, oConst.Procedures.AflWrapperDrop, oConst.Schemas.Main, sProcedure);
                    return oResult;
    	        }
    	        catch(e) {
    	            try { 
    	                oDB.callProcedure(oConst.Schemas.Main, oConst.Procedures.AflWrapperDrop, oConst.Schemas.Main, sProcedure);
    	            } catch(ex) {}
    	            throw e;
    	        }
	        };
	        
	        /**
	         * Gets the execution function for an algorithm.
	         * @private
	         * @param   {string}    sName   The name of the PAL algorithm.
	         * @returns {function}  A function which, when called, completely executes a PAL algorithm transiently.
	         * The returned function can accept the following parameters:
	         *  {object[]}  oData   The input data of the PAL algorithm.
	         *  {object}    oParams The parameters for the control table.
	         * The returned function will return the result of running the PAL algorithm.
	         */
	        fnGetExec = function(sName) {
	            switch (sName) {
	                
	                case "ARIMA": return function(oData, oParams) {
	                    if (!oData || !oData.length) {
	                        return {result: [], statistics: null};
	                    }
	                    var oResult = fnCreateAndRunPal('ARIMATRAIN', oData, oParams);
        	            oResult = fnCreateAndRunPal('ARIMAFORECAST', oResult.P3, oParams);
            	        return {result: oResult.P3, statistics: null};
	                };
	                
	                case "SINGLESMOOTH":
	                case "DOUBLESMOOTH":
	                case "TRIPLESMOOTH":
	                case "BROWNEXPSMOOTH": 
	                case "CROSTON":  return (function(sArea) {
                        return function(oData, oParams) {
    	                    if (!oData || !oData.length) {
    	                        return {result: [], statistics: null};
    	                    }
    	                    var oResult = fnCreateAndRunPal(sArea, oData, oParams);
                	        return {result: oResult.P3, statistics: oResult.P4};
                	
                        };
                    }(sName));
                    
	                case "SEASONALITYTEST":
                    case "TRENDTEST":
	                case "LRWITHSEASONALADJUST": 
	                case "FORECASTSMOOTHING":  return (function(sArea) {
                        return function(oData, oParams) {
    	                    if (!oData || !oData.length) {
    	                        return {result: [], statistics: null};
    	                    }
    	                    var oResult = fnCreateAndRunPal(sArea, oData, oParams);
                	        return {result: oResult.P4, statistics: oResult.P3};
                	
                        };
                    }(sName));
                    
                    case "WHITENOISETEST": return function(oData, oParams) {
	                    if (!oData || !oData.length) {
	                        return {result: [], statistics: null};
	                    }
	                    var oResult = fnCreateAndRunPal('WHITENOISETEST', oData, oParams);
            	        return {statistics: oResult.P3, result: null};
	                };
	                
	            }
	        };
	        
	        /**
	         * Reads the values for the input of the PAL.
	         * @private
	         * @param   {object}    oParams     The configuration parameters for selecting the input data. 
	         * @param   {string}    oParams.source  The source of the data. Either "offset" (offset from the
	         *                                      limits), "average" (taken from the daily value averages view) 
	         *                                      or "count" (taken fom the daily limit violations view).
	         * @param   {string}    oParams.measure The ID of the measure for the values.
	         * @param   {string}    oParams.breakDown   The time aggregation type (Day, Month or Year).
	         * @param   {string}    oParams.filterType  The type of filtering (Route, Schedule, Person, Organization).
	         * @param   {string}    oParams.filterValue The ID of the filtered entity.
	         * @param   {string=}   oParams.start       Optionally, the start date for pulling the data.
	         * @param   {string=}   oParams.end         Optionally, the end date for pulling the data.
	         * @returns {object[]}  The input data.
	         */
	        fnGetInput = function(oParams) {
	            var aJoins = [],
                    sWhere = "",
                    oRaw,
                    aOrderBy = [],
                    aGroupBy = [],
                    aSelect = [],
                    aPrepared = [oParams.measure, oParams.filterValue],
                    oData;
                    
	            switch (oParams.source) {
                case "value": 
                    aSelect.push('AVG("MV"."value") AS "value"');
                    break;
                case "count":
                    aSelect.push('COUNT("MV"."timestamp") AS "value"');
                    aJoins.push(oMU.format('INNER JOIN "{0}"."{1}" AS "L" ON "L"."transport" = "MV"."transport"'
                        + ' AND "L"."measure" = "MV"."measure" AND (("L"."lowerBound" IS NOT NULL AND'
                        + ' "L"."lowerBound" > "MV"."value" ) OR ("L"."upperBound" IS NOT NULL AND'
                        + ' "L"."upperBound" < "MV"."value") )', oConst.Schemas.Main, oConst.Tables.Limit));
                    break;
                default:
                    aSelect.push('AVG(CASE WHEN "L"."lowerBound" IS NULL THEN ABS("L"."upperBound" - "MV"."value")'
                        + ' WHEN "L"."upperBound" IS NULL THEN ABS("L"."lowerBound" - "MV"."value") ELSE'
                        + ' LEAST(ABS("L"."lowerBound" - "MV"."value"), ABS("L"."upperBound" - "MV"."value"))'
                        + ' END) AS "value"');
                    aJoins.push(oMU.format('INNER JOIN "{0}"."{1}" AS "L" ON "L"."transport" = "MV"."transport"'
                        + ' AND "L"."measure" = "MV"."measure" AND (("L"."lowerBound" IS NOT NULL AND'
                        + ' "L"."lowerBound" > "MV"."value" ) OR ("L"."upperBound" IS NOT NULL AND'
                        + ' "L"."upperBound" < "MV"."value") )', oConst.Schemas.Main, oConst.Tables.Limit));
                    break;
                }
                
                 /* eslint-disable no-fallthrough */
                switch(oParams.breakDown) {
                case "Day":
                    aGroupBy.push('DAYOFMONTH("MV"."timestamp")');
                    aOrderBy.unshift('DAYOFMONTH("MV"."timestamp")');
                case "Month":
                    aGroupBy.push('MONTH("MV"."timestamp")');
                    aOrderBy.unshift('MONTH("MV"."timestamp")');
                case "Year":
                    aGroupBy.push('YEAR("MV"."timestamp")');
                    aOrderBy.unshift('YEAR("MV"."timestamp")');
                    break;
                }
                /* eslint-enable no-fallthrough */
                
                switch(oParams.breakDown) {
                case "Day":
                    aSelect.push('TO_TIMESTAMP(YEAR("MV"."timestamp") || \'-\' || MONTH("MV"."timestamp") || \'-\' ||'
                        + ' DAYOFMONTH("MV"."timestamp"), \'YYYY-MM-DD\') as "date"');
                    break;
                case "Month":
                    aSelect.push('TO_TIMESTAMP(YEAR("MV"."timestamp") || \'-\' || MONTH("MV"."timestamp") || \'-01\','
                        + ' \'YYYY-MM-DD\') as "date"');
                    break;
                case "Year":
                    aSelect.push('TO_TIMESTAMP(YEAR("MV"."timestamp") || \'-01-01\', \'YYYY-MM-DD\') as "date"');
                    break;
                }
                
                switch(oParams.filterType) {
                case "Route":
                    sWhere = 'WHERE "T"."route" = ?';
                    break;
                case "Schedule":
                    sWhere = 'WHERE "T"."schedule" = ?';
                    break;
                case "Person":
                    sWhere = oMU.format('EXISTS (SELECT * FROM "{0}"."{1}" AS "IW" WHERE'
                        + ' "IW"."transport" = "T"."id" AND "IW"."person" = ?)', 
                        oConst.Schemas.Main, oConst.Tables.Involvement);
                    break;
                case "Organization":
                    sWhere = oMU.format('EXISTS (SELECT * FROM "{0}"."{1}" AS "IW" INNER JOIN'
                        + ' "{0}"."{2}" AS "IP" ON "IP"."id" = "IW"."person" AND "IW"."transport" = "T"."id"'
                        + ' AND "IP"."organization" = ?)', oConst.Schemas.Main, oConst.Tables.Involvement,
                        oConst.Tables.Person);
                    break;
                }
                
                if (oParams.start) {
                    sWhere += ' AND "MV"."timestamp" >= TO_TIMESTAMP(?, \'YYYY-MM-DD\')';
                    aPrepared.push(oParams.start);
                }
                if (oParams.end) {
                    sWhere += ' AND "MV"."timestamp" <= TO_TIMESTAMP(?, \'YYYY-MM-DD\')';
                    aPrepared.push(oParams.end);
                }
                
                oRaw = oDB.querf('SELECT {3} FROM "{0}"."{1}" AS "MV" INNER JOIN "{0}"."{2}" AS "T"'
                        + ' ON "MV"."transport" = "T"."id" AND "MV"."measure" = ? {4} {5} {6} {7}', 
                        [oConst.Schemas.Main, oConst.Views.MeasuredValue, oConst.Tables.Transport, 
                        aSelect.join(", "), aJoins.join(" "), sWhere, "GROUP BY " + aGroupBy.join(", "), 
                        "ORDER BY " + aOrderBy.join(", ")], aPrepared);
                oData = oDB.callProcedure(oConst.Schemas.Main, oConst.Procedures.FillGaps, oRaw, oParams.breakDown);
                
                return {
                    data:       oData.et_values,
                    start:      oData.ev_min_date,
                    end:        oData.ev_max_date,
                    interval:   oParams.breakDown
                };
	        };
	        
	        /**
	         * PAL controller.
	         * @class
	         * @param   {Connection}    oConnection     The HDB connection.
	         * @param   {ErrorHandler}  oErrorHandler   The error handler.
	         */
            function PalController(oConnection, oErrorHandler) {
                /** @protected @type {ErrorHandler} */
                this.oErrorHandler = oErrorHandler;
                
                /** @protected @type {Connection} */
                this.oConnection = oConnection;
            }
            
            /**
             * Executes a PAL (forecasting) algorithm.
             * @public
             * @param   {object}    oParams     The parameters given to the API.
             * @param   {object}    oParams.input   An object containing the criteria for selecting the input @see {@link fnGetInput}.
             * @param   {object}    oParams.control An object containing the control parameters @see {@link PalHelper.getCotrol}.
             * @param   {string}    oParams.algorithm   The name of the algorithm.
             * @returns {object}    An object containing the results (input, output and statistics).
             */
            PalController.prototype.execute = function(oParams) {
                var oInput      = fnGetInput(oParams.input),
                    sAlgorithm  = oParams.algorithm.toUpperCase(),
                    fnExec      = fnGetExec(sAlgorithm),
                    oResult     = fnExec(oInput.data, oParams.control || {}),
                    aOutput     = oResult.result ? oHelper.transformOutput(sAlgorithm, oInput, oResult.result) : null;
                return {
                    result:     oHelper.mixInputAndOutput(oHelper.transformInput(oInput), aOutput),
                    statistics: oResult.statistics
                };
            };
            
            /**
             * Retrieves the algorithm count.
             * Currently hardcoded, as the algorithm properties are built through a switch-based mechnism.
             * @returns {int}   The number of available algorithms.
             */
            PalController.prototype.getAlgorithmCount = function() {
                return 10;
            };
            
            return PalController;
	    }
	);
}