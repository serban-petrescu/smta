function immediate(fnDefine) {
	fnDefine(["./constants", "./../common/miscUtils"], [], function(oConst, oMU) {
		"use strict";
		var fnProcessParameters,
		    fnGetCloner,
		    fnAddInterval;
		   
		/** 
		 * Adds an interval to a date.
		 * @param   {Date}      oInput      The input date to be added to.
		 * @param   {string}    sInterval   The type of interval (Day, Month, Year).
		 * @param   {int}       iCount      The number of units (intervals) to be added.
		 * @returns {int}   The computed timestamp.
		 */
		fnAddInterval = function(oInput, sInterval, iCount) {
		    switch (sInterval) {
		        case "Day":     return oInput.getTime() + iCount * (24 * 3600 * 1000);
		        case "Month":   return new Date(oInput.getFullYear(), oInput.getMonth() + iCount, 1).getTime();
		        case "Year":    return new Date(oInput.getFullYear() + iCount, 1, 1).getTime();
		    }
		};
		
		/**
		 * Retrieves the result cloning function for an algorithm.
		 * @param   {string}    sName   The name of the algorithm.
		 * @returns {function}  The cloning function. Will accept four parameters: 
		 *  {object}    oData       The result line to be cloned.
		 *  {date}      oStart      The start date of the series.
		 *  {date}      oEnd        The end date of the series.
		 *  {string}    sInterval   The interval type between two consecutive snapshots.
		 */
		fnGetCloner = function(sName) {
		    switch(sName) {
		        case "ARIMA": return function(oData, oStart, oEnd, sInterval) {
		            return {
		                timestamp: fnAddInterval(oEnd, sInterval, oData.id + 1),
                        mean     : oData.mean,
                        low80    : oData.low80,
                        high80   : oData.high80,
                        low95    : oData.low95,
                        high95   : oData.high95
		            };
		        };
		        case "SEASONALITYTEST":
		        case "TRENDTEST":
		        case "SINGLESMOOTH":
		        case "DOUBLESMOOTH":
		        case "TRIPLESMOOTH":
		        case "LRWITHSEASONALADJUST":
		        case "CROSTON":
		        case "BROWNEXPSMOOTH": return function(oData, oStart, oEnd, sInterval) {
		            return {
		                timestamp: fnAddInterval(oStart, sInterval, (oData.id - 1)),
                        result   : oData.value
		            };
		        };
		        case "FORECASTSMOOTHING": return function(oData, oStart, oEnd, sInterval) {
		            return {
		                timestamp: fnAddInterval(oStart, sInterval, (oData.id - 1)),
                        result   : oData.value,
                        error    : oData.error      
		            };
		        };
		    }
		};
		
		/**
		 * Filters, validates and transforms the given parameters to fit the specification and needed format.
		 * @param   {object}    oActual     The map of parameters given as input.
		 * @param   {object[]}  aPermitted  The array of allowed parameters.
		 * @param   {string}    aPermitted.name     The name of a parameter.
		 * @param   {string}    aPermitted.type     The type of a parameter (either integer, double or string).
		 * @returns {object[]}  An array of lines which correspond to the PAL control table.
		 */
		fnProcessParameters = function(oActual, aPermitted) {
		    var i,
		        aResult = [],
		        iValue;
		    for (i = 0; i < aPermitted.length; ++i) {
		        if (oActual.hasOwnProperty(aPermitted[i].name)) {
		            if (aPermitted[i].type === "integer") {
		                if (typeof oActual[aPermitted[i].name] === "boolean") {
		                    iValue = oActual[aPermitted[i].name] ? 1 : 0;
		                }
		                else {
		                    iValue = parseInt(oActual[aPermitted[i].name], 10);
		                }
		            }
		            aResult.push({
                        NAME       : aPermitted[i].name,
                        INTARGS    : aPermitted[i].type === "integer" ? iValue : null,
                        DOUBLEARGS : aPermitted[i].type === "double" ? parseFloat(oActual[aPermitted[i].name]) : null,
                        STRINGARGS : aPermitted[i].type === "string" ? oActual[aPermitted[i].name] + "" : null
		            });
		        }
		    }
		    return aResult;
		};
		
		return {
		    
		    /**
		     * Merges the input and output arrays (to be suitable for plotting on a chart).
		     * @param   {object[]}  aInput  The (already transformed) input array.
		     * @param   {object[]}  aOutput The (already transformed) output array.
		     * @returns {object[}}  The two arrays merged.
		     */
		    mixInputAndOutput: function(aInput, aOutput) {
		        var i = 0,
		            j = 0,
		            oRight,
		            oLeft,
		            aResult = [],
		            fnCompare;
		            
		        if (!aInput) {
		            return aOutput;
		        }
		        if (!aOutput) {
		            return aInput;
		        }
		        
		        fnCompare = function(oA, oB){return oA.timestamp - oB.timestamp;};
		        aInput.sort(fnCompare);
		        aOutput.sort(fnCompare);
		        
		        while (i < aInput.length || j < aOutput.length) {
		            oLeft = aInput[i];
		            oRight = aOutput[j];
		            if (!oLeft || (oRight && oLeft.timestamp > oRight.timestamp)) {
		                aResult.push(oMU.clone(oRight));
		                ++j;
		            }
		            else if (!oRight || (oLeft && oLeft.timestamp < oRight.timestamp)) {
		                aResult.push(oMU.clone(oLeft));
		                ++i;
		            }
		            else  {
		                aResult.push(oMU.extend(oLeft, oRight));
		                ++i;
		                ++j;
		            }
		        }
		        
		        return aResult;
		    },
		    
		    /**
		     * Transforms the input of the PAL algorithm in order to be outputed.
		     * @param   {object}    oInput      The input object which was used for the PAL.
		     * @param   {date}      oInput.start    The start date of the series.
		     * @param   {date}      oInput.end      The end date of the series.
		     * @param   {integer}   oInput.interval The time interval between consecutive snapshots.
		     * @param   {object[]}  oInput.data     The data passed for forcasting.
		     * @param   {integer}   oInput.data.id      The id of a data point.
		     * @param   {float}     oInput.data.value   The value of a data point.
		     * @returns {object[]}  The data, prepared for being output'ed in the UI.    
		     */
		    transformInput: function(oInput) {
		        var aResult = [],
		            i;
		        for (i = 0; i < oInput.data.length; ++i) {
		            aResult.push({
		                timestamp:  fnAddInterval(oInput.start, oInput.interval, (oInput.data[i].id - 1)),
		                value:      parseFloat(oInput.data[i].value)
		            });
		        }
		        return aResult;
		    },
		    
		    /**
		     * Transforms the output of the PAL algorithm in order to be outputed.
		     * @param   {string}    sName       The name of the PAL algorithm.
		     * @param   {object}    oInput      The input object which was used for the PAL.
		     * @param   {date}      oInput.start    The start date of the series.
		     * @param   {date}      oInput.end      The end date of the series.
		     * @param   {integer}   oInput.interval The interval type between consecutive snapshots.
		     * @param   {object[]}  oInput.data     The data passed for forcasting.
		     * @param   {integer}   oInput.data.id      The id of a data point.
		     * @param   {float}     oInput.data.value   The value of a data point.
		     * @param   {object[]}  oOutput     The data returned by the PAL algorithm.
		     * @returns {object[]}  The data, prepared for being output'ed in the UI.    
		     */
		    transformOutput: function(sName, oInput, oOutput) {
		        var fnClone = fnGetCloner(sName),
		            aResult = [],
		            i;
		        for (i = 0; i < oOutput.length; ++i) {
		            aResult.push(fnClone(oOutput[i], oInput.start, oInput.end, oInput.interval));
		        }
		        return aResult;
		    },
		    
		    /**
		     * Gets the control table for a given algorithm, based on the input of the API.
		     * @param   {string}    sName   The name of the algorithm.
		     * @param   {object}    oActual A map of parameters, as passed to the API.
		     * @returns {object[]}  The content of the control table.
		     */
		    getControl: function(sName, oActual) {
		        switch(sName) {
		            case "ARIMATRAIN": return fnProcessParameters(oActual, [
		                {name: "D",                 type: "integer"},
		                {name: "P",                 type: "integer"},
		                {name: "Q",                 type: "integer"},
		                {name: "METHOD",            type: "integer"},
		                {name: "STATIONARY",        type: "integer"},
		                {name: "SEASONAL_D",        type: "integer"},
		                {name: "SEASONAL_P",        type: "integer"},
		                {name: "SEASONAL_Q",        type: "integer"},
		                {name: "SEASONAL_PERIOD",   type: "integer"}
		            ]);
		            case "ARIMAFORECAST": return fnProcessParameters(oActual, [
		                {name: "ForecastLength",    type: "integer"}
		            ]);
		            case "BROWNEXPSMOOTH": return fnProcessParameters(oActual, [
		                {name: "ALPHA",             type: "double"},
		                {name: "DELTA",             type: "double"},
		                {name: "FORECAST_NUM",      type: "integer"},
		                {name: "ADAPTIVE_METHOD",   type: "integer"},
		                {name: "MEASURE_NAME",      type: "string"},
		                {name: "IGNORE_ZERO",       type: "integer"},
		                {name: "EXPOST_FLAG",       type: "integer"}
		            ]);
		            case "CROSTON": return fnProcessParameters(oActual, [
		                {name: "ALPHA",             type: "double"},
		                {name: "FORECAST_NUM",      type: "integer"},
		                {name: "METHOD",            type: "integer"},
		                {name: "MEASURE_NAME",      type: "string"},
		                {name: "EXPOST_FLAG",       type: "integer"},
		                {name: "IGNORE_ZERO",       type: "integer"}
		            ]);
		            case "LRWITHSEASONALADJUST": return fnProcessParameters(oActual, [
		                {name: "FORECAST_LENGTH",       type: "integer"},
		                {name: "TREND",                 type: "double"},
		                {name: "AFFECT_FUTURE_ONLY",    type: "integer"},
		                {name: "SEASONALITY",           type: "integer"},
		                {name: "PERIODS",               type: "integer"},
		                {name: "MEASURE_NAME",          type: "string"},
		                {name: "SEASONAL_HANDLE_METHOD",type: "integer"},
		                {name: "EXPOST_FLAG",           type: "integer"},
		                {name: "IGNORE_ZERO",           type: "integer"}
		            ]);
		            case "FORECASTSMOOTHING": return fnProcessParameters(oActual, [
		                {name: "FORECAST_MODEL_NAME",   type: "string"},
		                {name: "OPTIMIZER_TIME_BUDGET", type: "integer"},
		                {name: "ALPHA",                 type: "double"},
		                {name: "BETA",                  type: "double"},
		                {name: "GAMMA",                 type: "double"},
		                {name: "FORECAST_NUM",          type: "integer"},
		                {name: "CYCLE",                 type: "integer"},
		                {name: "MODELSELECTION",        type: "integer"},
		                {name: "SEASONAL",              type: "integer"},
		                {name: "INITIAL_METHOD",        type: "integer"},
		                {name: "TRAINING_RATIO",        type: "double"},
		                {name: "OPTIMIZATION_METHOD",   type: "integer"},
		                {name: "DAMPED",                type: "integer"},
		                {name: "ACCURACY_MEASURE",      type: "string"}
		            ]);
		            case "SINGLESMOOTH": return fnProcessParameters(oActual, [
		                {name: "ALPHA",                 type: "double"},
		                {name: "DELTA",                 type: "double"},
		                {name: "FORECAST_NUM",          type: "integer"},
		                {name: "ADAPTIVE_METHOD",       type: "integer"},
		                {name: "MEASURE_NAME",          type: "string"},
		                {name: "EXPOST_FLAG",           type: "integer"},
		                {name: "IGNORE_ZERO",           type: "integer"}
		            ]);
		            case "DOUBLESMOOTH": return fnProcessParameters(oActual, [
		                {name: "ALPHA",                 type: "double"},
		                {name: "BETA",                  type: "double"},
		                {name: "FORECAST_NUM",          type: "integer"},
		                {name: "ADAPTIVE_METHOD",       type: "integer"},
		                {name: "MEASURE_NAME",          type: "string"},
		                {name: "PHI",                   type: "double"},
		                {name: "DAMPED",                type: "integer"},
		                {name: "EXPOST_FLAG",           type: "integer"},
		                {name: "IGNORE_ZERO",           type: "integer"}
		            ]);
		            case "TRIPLESMOOTH": return fnProcessParameters(oActual, [
		                {name: "ALPHA",                 type: "double"},
		                {name: "BETA",                  type: "double"},
		                {name: "GAMMA",                 type: "double"},
		                {name: "CYCLE",                 type: "integer"},
		                {name: "FORECAST_NUM",          type: "integer"},
		                {name: "SEASONAL",              type: "integer"},
		                {name: "INITIAL_METHOD",        type: "integer"},
		                {name: "PHI",                   type: "double"},
		                {name: "DAMPED",                type: "integer"},
		                {name: "MEASURE_NAME",          type: "string"},
		                {name: "EXPOST_FLAG",           type: "integer"},
		                {name: "IGNORE_ZERO",           type: "integer"}
		            ]);
		            case "SEASONALITYTEST": return fnProcessParameters(oActual, [
		                {name: "ALPHA",                 type: "double"}
		            ]);
		            case "TRENDTEST": return fnProcessParameters(oActual, [
		                {name: "ALPHA",                 type: "double"},
		                {name: "METHOD",                type: "integer"}
		            ]);
		            case "WHITENOISETEST": return fnProcessParameters(oActual, [
		                {name: "LAG",                   type: "integer"},
		                {name: "PROBABILITY",           type: "double"}
		            ]); 
		        }
		    },
		    
		    /**
		     * Gets the signature table for a PAL algorithm.
		     * @param   {string}    sName   The name of the PAL algorithm.
		     * @returns {object[]}  The contents of the signature table.
		     */
		    getSignature: function(sName) {
		        switch(sName) {
		            case "ARIMATRAIN": return [{
                        POSITION        : 1,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastInput,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 2,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.Control,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 3,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ArimaModel,
                        PARAMETER_TYPE  : "OUT"
    	            }];
		            case "ARIMAFORECAST": return [{
                        POSITION        : 1,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ArimaModel,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 2,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.Control,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 3,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ArimaResults,
                        PARAMETER_TYPE  : "OUT"
    	            }];
    	            case "SINGLESMOOTH":
    	            case "DOUBLESMOOTH":
	                case "TRIPLESMOOTH":
    	            case "CROSTON":
    	            case "BROWNEXPSMOOTH": return [{
                        POSITION        : 1,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastInput,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 2,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.Control,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 3,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastResult,
                        PARAMETER_TYPE  : "OUT"
    	            },{
                        POSITION        : 4,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastStatistics,
                        PARAMETER_TYPE  : "OUT"
    	            }];
    	            case "LRWITHSEASONALADJUST" :return [{
                        POSITION        : 1,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastInput,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 2,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.Control,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 3,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastStatistics,
                        PARAMETER_TYPE  : "OUT"
    	            },{
                        POSITION        : 4,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastResult,
                        PARAMETER_TYPE  : "OUT"
    	            }];
    	            case "FORECASTSMOOTHING": return [{
                        POSITION        : 1,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastInput,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 2,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.Control,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 3,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastSmoothingParams,
                        PARAMETER_TYPE  : "OUT"
    	            },{
                        POSITION        : 4,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastSmoothingResult,
                        PARAMETER_TYPE  : "OUT"
    	            }];
    	            case "SEASONALITYTEST": return [{
                        POSITION        : 1,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastInput,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 2,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.Control,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 3,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.SeasonalityResult,
                        PARAMETER_TYPE  : "OUT"
    	            },{
                        POSITION        : 4,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastResult,
                        PARAMETER_TYPE  : "OUT"
    	            }];
    	            case "TRENDTEST": return [{
                        POSITION        : 1,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastInput,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 2,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.Control,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 3,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.TestResult,
                        PARAMETER_TYPE  : "OUT"
    	            },{
                        POSITION        : 4,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastResult,
                        PARAMETER_TYPE  : "OUT"
    	            }];
    	            case "WHITENOISETEST": return [{
                        POSITION        : 1,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.ForecastInput,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 2,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.Control,
                        PARAMETER_TYPE  : "IN"
    	            },{
                        POSITION        : 3,
                        SCHEMA_NAME     : oConst.Schemas.Main,
                        TYPE_NAME       : oConst.Types.WhiteNoise,
                        PARAMETER_TYPE  : "OUT"
    	            }];
		        }
		    }
		};
	});
}