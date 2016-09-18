function define(fnDefine) {
    "use strict";
	fnDefine([
	        "./constants", 
	        "./../common/dbUtils", 
	        "./../common/miscUtils"
	    ],[
	        "$/hdb/Connection", 
	        "./../common/ErrorHandler"
	    ], 
	    function(oConst, oDB, oMU) { 
	        
	        /**
	         * Secondary WebAPI controller.
	         * @class
	         * @param   {Connection}    oConnection     The HDB connection.
	         * @param   {ErrorHandler}  oErrorHandler   The error handler.
	         */
            function SecondaryController(oConnection, oErrorHandler) {
                /** @protected @type {ErrorHandler} */
                this.oErrorHandler = oErrorHandler;
                
                /** @protected @type {Connection} */
                this.oConnection = oConnection;
            }
            
            
            /**
             * Reads a set of values with positions as geo JSON.
             * @param {string}  sTransport  The transport ID in which the values were read.
             * @param {string}  sMeasure    The measure ID.
             * @param {int=}    iFromTs     The starting time.
             * @param {int=}    iToTs       The ending time.
             * @returns {object[]} An array of results.
             */
        	SecondaryController.prototype.readValues = function(sTransport, sMeasure, iFromTs, iToTs) {
        	    var sSql,
        	        aParams,
        	        aData, 
        	        oData,
        	        j;
        	    if (!sTransport || !sMeasure) {
        	        throw "Insufficient paramters";
        	    }
        		sSql = oMU.format('SELECT "value", "position".ST_AsGeoJSON() as "position", "timestamp" FROM "{0}"."{1}"' 
        			+ ' WHERE "transport" = ? AND "measure" = ?', oConst.Schemas.Main, oConst.Tables.MeasuredValue);
        		aParams = [sTransport, sMeasure];
        		if (iFromTs !== undefined) {
        			sSql += ' AND "timestamp" >= ?';
        			aParams.push(parseInt(iFromTs, 10));
        		}
        		if (iToTs !== undefined) {
        			sSql += ' AND "timestamp" <= ?';
        			aParams.push(parseInt(iToTs, 10));
        		}
        		sSql += ' ORDER BY "timestamp"';
        		oData = oDB.query(sSql, aParams);
        		aData = [];
        		for (j = 0; j < oData.length; ++j) {
        		    aData.push({
        		        value:      oData[j].value,
        		        timestamp:  oData[j].timestamp.getTime(),
        		        position:   oMU.unwrapGeoJsonPoint(oData[j].position)
        		    });
        		}
                return aData;
        	};
    
            /**
             * Reads the transports which use a given measure.
             * @returns {Object[]} An array of measures (each object contains the measure id and an array of transports).
             */
            SecondaryController.prototype.readMeasureTransports = function() {
                var aData = oDB.querf('SELECT DISTINCT "t"."id" AS "tid", "t"."description" AS "tname", "m"."id" AS "mid",' 
                    + ' "m"."name" AS "mname", "m"."unit" AS "unit" FROM "{0}"."{1}" AS "t" INNER JOIN "{0}"."{2}" AS "d"'
                    + ' ON "t"."id" = "d"."transport" INNER JOIN "{0}"."{3}" AS "s" ON "d"."id" = "s"."device"'
                    + ' INNER JOIN "{0}"."{4}" AS "st" ON "s"."sensorType" = "st"."id" INNER JOIN "{0}"."{5}" AS "m"'
                    + ' ON "st"."measure" = "m"."id" ORDER BY "m"."id"',  [oConst.Schemas.Main, oConst.Tables.Transport, 
                    oConst.Tables.Device, oConst.Tables.DeviceSensor, oConst.Tables.SensorType, oConst.Tables.Measure]
                );
                var aResult = [], oCurrent = null;
                for (var i = 0; i < aData.length; ++i) {
                    if (!oCurrent) {
                        oCurrent = {id: aData[i].mid, name: aData[i].mname, unit: aData[i].unit, transports: []};
                    }
                    else if (oCurrent.id !== aData[i].mid) {
                        aResult.push(oCurrent);
                        oCurrent = {id: aData[i].mid, name: aData[i].mname, unit: aData[i].unit, transports: []};
                    }
                    oCurrent.transports.push({id: aData[i].tid, name: aData[i].tname});
                }
                if (oCurrent) {
                    aResult.push(oCurrent);
                }
                return aResult;
            };
            
            
            /**
             * Reads the measures for a transport.
             * @returns {Object[]} An array of transports (each object contains the transport id and an array of measures).
             */
            SecondaryController.prototype.readTransportMeasures = function() {
                var aData = oDB.querf('SELECT DISTINCT "t"."id" AS "tid", "t"."description" AS "tname", "m"."id" AS "id",' 
                    + ' "m"."name", "m"."unit", "l"."lowerBound", "l"."upperBound" FROM "{0}"."{1}" AS "t" INNER JOIN'
                    + ' "{0}"."{2}" AS "d" ON "t"."id" = "d"."transport" INNER JOIN "{0}"."{3}" AS "s" ON "d"."id" = "s"."device"'
                    + ' INNER JOIN "{0}"."{4}" AS "st" ON "s"."sensorType" = "st"."id" INNER JOIN "{0}"."{5}" AS "m"'
                    + ' ON "st"."measure" = "m"."id" LEFT JOIN "{0}"."{6}" AS "l" ON "t"."id" = "l"."transport" AND' 
                    + ' "m"."id" = "l"."measure" ORDER BY "t"."id"', [oConst.Schemas.Main, oConst.Tables.Transport, oConst.Tables.Device, 
                    oConst.Tables.DeviceSensor, oConst.Tables.SensorType, oConst.Tables.Measure, oConst.Tables.Limit]
                );
                var aResult = [], oCurrent = null;
                for (var i = 0; i < aData.length; ++i) {
                    if (!oCurrent) {
                        oCurrent = {id: aData[i].tid, name: aData[i].tname, measures: []};
                    }
                    else if (oCurrent.id !== aData[i].tid) {
                        aResult.push(oCurrent);
                        oCurrent = {id: aData[i].tid, name: aData[i].tname, measures: []};
                    }
                    oCurrent.measures.push({
                        id:     aData[i].id, 
                        name:   aData[i].name, 
                        unit:   aData[i].unit,
                        lower:  aData[i].lowerBound,
                        upper:  aData[i].upperBound
                    }); 
                }
                if (oCurrent) {
                    aResult.push(oCurrent);
                }
                return aResult;
            };
            
            /**
             * Compares the evolution of a given measure for two or more transports.
             * @param   {string}    sMeasure    The measure's UUID.
             * @param   {string[]}  aTransports An array of transport UUIDs.
             * @param   {integer}   iAlign      The alignment type.
             * @param   {integer}   iResolution The data representation resolution.
             * @returns {object[]}  The comparison result.
             */
            SecondaryController.prototype.compareTransports = function(sMeasure, aTransports, iAlign, iResolution) {
                if (!sMeasure || aTransports.length < 1) {
                    throw "Invalid arguments.";
                }
                var i;
                for (i = 0; i < aTransports.length; ++i) {
                    aTransports[i] = {id: aTransports[i]};
                }
                var oData = oDB.callProcedure(oConst.Schemas.Main, oConst.Procedures.CompareTransports, {
                    "it_transports":    aTransports,
                    "iv_measure":       sMeasure,
                    "iv_desired_count": iResolution,
                    "iv_align_type":    iAlign
                }).et_results;
                var aData = [];
                var oCurrent = null;
                for (i = 0; i < oData.length; ++i) {
                    if (!oCurrent) {
                        oCurrent = {timestamp: oData[i].timestamp.getTime()};
                    }
                    else if (oCurrent.timestamp !== oData[i].timestamp.getTime()) {
                        aData.push(oCurrent);
                        oCurrent = {timestamp: oData[i].timestamp.getTime()};
                    }
                    oCurrent[oData[i].transport] = oData[i].value;
                }
                return aData;
            };
            
            /**
             * Reads the statistical data.
             * @param   {string}    sValue      The value type to be read.
             * @param   {string}    sMeasure    The measure ID.
             * @param   {string}    sPeriod     The period / frequency (either daily or monthly).
             * @returns {object[]}  An array of objects which represent the result.
             */
            SecondaryController.prototype.readStatistics = function(sValue, sMeasure, sPeriod) {
                var mTables = {
                        value: {
                            daily:      oConst.Views.DailyValues,
                            monthly:    oConst.Views.MonthlyValues
                        },
                        count: {
                            daily:      oConst.Views.DailyViolations,
                            monthly:    oConst.Views.MonthlyViolations
                        },
                        offset: {
                            daily:      oConst.Views.DailyViolations,
                            monthly:    oConst.Views.MonthlyViolations
                        }
                    },
                    mFields = {
                        value:  "value",
                        count:  "v_count",
                        offset: "offset"
                    },
                    sTable = mTables[sValue] ? mTables[sValue][sPeriod] : undefined,
                    sField = mFields[sValue];
                if (sTable && sField) {
                    var oResult = oDB.querf('SELECT "{2}" as "value", "v_date" as "date" FROM "{0}"."{1}"'
                        + ' WHERE "measure" = ? ORDER BY "v_date"', [oConst.Schemas.Main, sTable, sField], [sMeasure]),
                        aResult = [],
                        i;
                    for (i = 0; i < oResult.length; ++i) {
                        aResult.push({
                            value: oResult[i].value,
                            date:  oResult[i].date.getTime()
                        });
                    }
                    return aResult;
                }
                else {
                    return [];
                }
            };
            
            /**
             * Build the advanced statistics from the configuration parameters.
             * @public
             * @param   {object}    oParams     The configuration parameters.
             * @param   {string=}   oParams.dataType    The data source type.
             * @param   {string=}   oParams.filterType  The filtering type.
             * @param   {string=}   oParams.timeType    The time break down type.
             * @param   {string=}   oParams.aggregationType The entity over which aggr should be made.
             * @param   {string[]}  oParams.filterValue The IDs of the filtered entities.
             * @returns {object}    The statistics.
             */
            SecondaryController.prototype.buildStatistics = function(oParams) {
                var aJoins = [],
                    sWhere = "",
                    aOrderBy = [],
                    aPrepared = [oParams.measure],
                    aGroupBy = [],
                    aSelect = [],
                    
                    /**
                     * Processes the data type.
                     * @param   {string}    sDataType   The data type.
                     * @returns {void}
                     */
                    fnProcessDataType = function(sDataType) {
                        switch (sDataType) {
                        case "Value": 
                            aSelect.push('AVG("MV"."value") AS "value"');
                            break;
                        case "Count":
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
                    },
                    
                    /**
                     * Processes the time type.
                     * @param   {string}    sTimeType   The time type.
                     * @returns {void}
                     */
                    fnProcessTimeType = function(sTimeType) {
                         /* eslint-disable no-fallthrough */
                        switch(sTimeType) {
                        case "Day":
                            aSelect.push('DAYOFMONTH("MV"."timestamp") AS "day"');
                            aGroupBy.push('DAYOFMONTH("MV"."timestamp")');
                            aOrderBy.unshift('DAYOFMONTH("MV"."timestamp")');
                        case "Month":
                            aSelect.push('MONTH("MV"."timestamp") AS "month"');
                            aGroupBy.push('MONTH("MV"."timestamp")');
                            aOrderBy.unshift('MONTH("MV"."timestamp")');
                        case "Year":
                            aSelect.push('YEAR("MV"."timestamp") AS "year"');
                            aGroupBy.push('YEAR("MV"."timestamp")');
                            aOrderBy.unshift('YEAR("MV"."timestamp")');
                            break;
                        }
                        /* eslint-enable no-fallthrough */
                    },
                    
                    /**
                     * Processes the agregation type.
                     * @param   {string}    sAggregationType   The aggregation type.
                     * @returns {void}
                     */
                    fnProcessAggregationType = function(sAggregationType) {
                        switch(sAggregationType) {
                        case "Route":
                            aSelect.push('"T"."route" AS "group"');
                            aGroupBy.push('"T"."route"');
                            break;
                        case "Schedule":
                            aSelect.push('"T"."route" AS "group"');
                            aGroupBy.push('"T"."route"');
                            break;
                        case "Transport":
                            aSelect.push('"T"."id" AS "group"');
                            aGroupBy.push('"T"."id"');
                            break;
                        case "Person":
                            aSelect.push('"P"."id" AS "group"');
                            aGroupBy.push('"P"."id"');
                            aJoins.push(oMU.format('INNER JOIN "{0}"."{1}" AS "P" ON EXISTS( SELECT * FROM'
                                + ' "{0}"."{2}" AS "I" WHERE "I"."transport" = "T"."id" AND "I"."person" = "P"."id")',
                                oConst.Schemas.Main, oConst.Tables.Person, oConst.Tables.Involvement));
                            break;
                        case "Organization":
                            aSelect.push('"O"."id" AS "group"');
                            aGroupBy.push('"O"."id"');
                            aJoins.push(oMU.format('INNER JOIN "{0}"."{1}" AS "O" ON EXISTS( SELECT * FROM'
                                + ' "{0}"."{2}" AS "I" INNER JOIN "{0}"."{3}" AS "P" ON "I"."transport" = "T"."id"'
                                + ' AND "I"."person" = "P"."id" AND "P"."organization" = "O"."id")',
                                oConst.Schemas.Main, oConst.Tables.Organization, oConst.Tables.Involvement,
                                oConst.Tables.Person));
                            break;
                        }
                    },
                    
                    /**
                     * Processes the filter type and value.
                     * @param   {string}    sFilterType    The filter type.
                     * @param   {string[]}  aFilterValue   The filter value.
                     * @param   {string}    sAggregationType   The aggregation type.
                     * @returns {void}
                     */
                    fnProcessFilterType = function(sFilterType, aFilterValue, sAggregationType) {
                        if (typeof aFilterValue === "string") {
                            aFilterValue = aFilterValue.split(",");
                        }
                        
                        if (aFilterValue && aFilterValue.length) {
                            switch(sFilterType) {
                            case "Route":
                                sWhere = oMU.format('"T"."route" IN ({0})', 
                                    oMU.buildArrayOfElement(aFilterValue.length, "?").join(", "));
                                aPrepared.push.apply(aPrepared, aFilterValue);
                                break;
                            case "Schedule":
                                sWhere = oMU.format('"T"."schedule" IN ({0})', 
                                    oMU.buildArrayOfElement(aFilterValue.length, "?").join(", "));
                                aPrepared.push.apply(aPrepared, aFilterValue);
                                break;
                            case "Transport":
                                sWhere = oMU.format('"T"."id" IN ({0})', 
                                    oMU.buildArrayOfElement(aFilterValue.length, "?").join(", "));
                                aPrepared.push.apply(aPrepared, aFilterValue);
                                break;
                            case "Person":
                                if (sAggregationType === "Person") {
                                    sWhere = oMU.format('"P"."id" IN ({0})', 
                                        oMU.buildArrayOfElement(aFilterValue.length, "?").join(", "));
                                }
                                else {
                                    sWhere = oMU.format('EXISTS (SELECT * FROM "{0}"."{1}" AS "IW" WHERE'
                                        + ' "IW"."transport" = "T"."id" AND "IW"."person" IN ({2}))', 
                                        oConst.Schemas.Main, oConst.Tables.Involvement,
                                        oMU.buildArrayOfElement(aFilterValue.length, "?").join(", "));
                                }
                                aPrepared.push.apply(aPrepared, aFilterValue);
                                break;
                            case "Organization":
                                if (sAggregationType === "Organization") {
                                    sWhere = oMU.format('"O"."id" IN ({0})', 
                                        oMU.buildArrayOfElement(aFilterValue.length, "?").join(", "));
                                }
                                else if (sAggregationType === "Person") {
                                    sWhere = oMU.format('"P"."organization" IN ({0})', 
                                        oMU.buildArrayOfElement(aFilterValue.length, "?").join(", "));
                                }
                                else {
                                    sWhere = oMU.format('EXISTS (SELECT * FROM "{0}"."{1}" AS "IW" INNER JOIN'
                                        + ' "{0}"."{2}" AS "IP" ON "IP"."id" = "IW"."person" AND "IW"."transport" = "T"."id"'
                                        + ' AND "IP"."organization" IN ({3}))', oConst.Schemas.Main, oConst.Tables.Involvement,
                                        oConst.Tables.Person, oMU.buildArrayOfElement(aFilterValue.length, "?").join(", "));
                                }
                                aPrepared.push.apply(aPrepared, aFilterValue);
                                break;
                            }
                        }
                    },
                    
                    /**
                     * Resolves the name of the given entity.
                     * @param   {string}    sKey    The entity key.
                     * @param   {string}    sEntity The entity type.
                     * @param   {string=}   sField  The DB field which contains the "name".
                     * @returns {string}    The name of the entity.
                     */
                    fnResolveName = function(sKey, sEntity, sField) {
                        sField = sField || (sEntity === "Transport" ? "description" : "name");
                        var oEntity = oDB.querf('SELECT "{2}" FROM "{0}"."{1}" WHERE "id" = ?', [oConst.Schemas.Main,
                            oConst.Tables[sEntity], sField], [sKey]);
                        if (oEntity.length) {
                            return oEntity[0][sField];
                        }
                        else {
                            return "";
                        }
                    },
                    
                    /**
                     * Build a time value from a DB result.
                     * @param   {Result}    oResult     The DB reasulr.
                     * @returns {int}   The time value.
                     */
                    fnGetTime = function(oResult) {
                        return Date.UTC(oResult.year, oResult.month || 0, oResult.day || 1);
                    },
                    
                    /**
                     * Builds the configuration object.
                     * @param   {string}    sMeasureName    The name of the selected measure.
                     * @param   {string}    sMeasureUnit    The unit of the selected measure.
                     * @returns {object}    The config object.
                     */
                    fnGetConfig = function(sMeasureName, sMeasureUnit) {
                        var oConfig = {};
                        switch(oParams.dataType) {
                        case "Value":
                            oConfig.value = {title: {
                                text:   "i18n>valueTitleUnit",
                                params: ["i18n>valueSeries", sMeasureName, sMeasureUnit]
                            }};
                            break;
                        case "Count":
                            oConfig.value = {title: {
                                text:   "i18n>valueTitle",
                                params: ["i18n>countSeries", sMeasureName]
                            }};
                            break;
                        default:
                            oConfig.value = {title: {
                                text:   "i18n>valueTitleUnit",
                                params: ["i18n>offsetSeries", sMeasureName, sMeasureUnit]
                            }};
                            break;
                        }    
                        
                        if (oParams.timeType !== "None") {
                            oConfig.time = true;
                            switch(oParams.timeType) {
                                case "Day": 
                                    oConfig.levels = ["year", "month", "day"]; 
                                    oConfig.window = 1000 * 3600 * 25;
                                    break;
                                case "Month": 
                                    oConfig.levels = ["year", "month"]; 
                                    oConfig.window = 1000 * 3600 * 24 * 31;
                                    break;
                                default: 
                                    oConfig.levels = ["year"]; 
                                    oConfig.window = 1000 * 3600 * 24 * 31 * 12;
                                    break;
                            }
                            oConfig.measures = [];
                        }
                        else {
                            oConfig.window = {start: null, end: null};
                            oConfig.time = false;
                            oConfig.dimension = {name: "i18n>aggregationType" + oParams.aggregationType};
                            oConfig.measure = {name: sMeasureName};
                        }
                        return oConfig;
                    },
                    
                    /**
                     * Gets the statistical data.
                     * @returns {object}    The statistics.
                     */
                    fnGetData = function() {
                        var oResults = oDB.querf('SELECT {3} FROM "{0}"."{1}" AS "MV" INNER JOIN "{0}"."{2}" AS "T"'
                            + ' ON "MV"."transport" = "T"."id" AND "MV"."measure" = ? {4} {5} {6} {7}', 
                            [oConst.Schemas.Main, oConst.Views.MeasuredValue, oConst.Tables.Transport, 
                            aSelect.join(", "), aJoins.join(" "), sWhere ? "WHERE " + sWhere : "",
                            aGroupBy.length ? "GROUP BY " + aGroupBy.join(", ") : "", aOrderBy.length ? "ORDER BY "
                            + aOrderBy.join(", ") : ""], aPrepared),
                            aResults = [],
                            i,
                            iTime, 
                            mGroups = {},
                            sMeasureName = fnResolveName(oParams.measure, "Measure"), 
                            sMeasureUnit = fnResolveName(oParams.measure, "Measure", "unit"), 
                            oConfig = fnGetConfig(sMeasureName, sMeasureUnit);
                            
                        if (oParams.timeType !== "None") {
                            for (i = 0; i < oResults.length; ++i) {
                                if (oResults[i].group) {
                                    if (!mGroups.hasOwnProperty(oResults[i].group)) {
                                        mGroups[oResults[i].group] = fnResolveName(oResults[i].group, oParams.aggregationType);
                                    }
                                }
                                else {
                                    if (!mGroups.hasOwnProperty(oResults[i].group)) {
                                        mGroups[oResults[i].group] = sMeasureName;
                                    }
                                }
                                iTime = fnGetTime(oResults[i]);
                                if (!aResults.length || aResults[aResults.length - 1].date !== iTime) {
                                    aResults.push({
                                        date:  iTime
                                    });
                                }
                                aResults[aResults.length - 1][oResults[i].group] = Number(oResults[i].value);
                            }
                            
                            for (i in mGroups) {
                                if (mGroups.hasOwnProperty(i)) {
                                    oConfig.measures.push({
                                        name:   mGroups[i],
                                        field:  i
                                    });
                                }
                            }
                            
                            if (aResults.length) {
                                oConfig.window = {
                                    start:  aResults[0].date - oConfig.window,
                                    end:    aResults[aResults.length - 1].date + oConfig.window
                                };
                            }
                            else {
                                oConfig.window = {start: null, end: null};
                            }
                        }
                        else {
                            for (i = 0; i < oResults.length; ++i) {
                                if (oResults[i].group && !mGroups.hasOwnProperty(oResults[i].group)) {
                                    mGroups[oResults[i].group] = fnResolveName(oResults[i].group, oParams.aggregationType);
                                }
                                aResults.push({
                                    label:  mGroups[oResults[i].group],
                                    value:  Number(oResults[i].value)
                                });
                            }
                        }
                        return {
                            results:    aResults,
                            config:     oConfig
                        };
                    };
                
                fnProcessDataType(oParams.dataType);
                fnProcessTimeType(oParams.timeType);
                fnProcessAggregationType(oParams.aggregationType);
                fnProcessFilterType(oParams.filterType, oParams.filterValue, oParams.aggregationType);
                
                return fnGetData();
                
            };
	        
	        return SecondaryController;
	    }
	);
}