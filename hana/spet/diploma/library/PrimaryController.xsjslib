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
	        var fnResolveDevice,
	            fnGetSensors,
	            fnProcessPositionData,
	            fnSendEmail,
	            fnInsertEvent,
	            fnSendPostToMailService,
	            fnFormatDate,
	            fnGetSystemFields,
	            fnComputeVirtual;
	        
	        /**
	         * Formats a given date.
	         * @param {Date}    oDate The date value.
	         * @returns {string} The formatted date.
	         */
	        fnFormatDate = function (oDate) {
            	var fnPad = function(iValue, iNumber) {
            		var sValue = iValue + "";
            		while (sValue.length < iNumber) {
            			sValue = "0" + sValue;
            		}
            		return sValue;
            	};
            	return fnPad(oDate.getDate(), 2) + "." + fnPad(oDate.getMonth() + 1, 2) + "." + oDate.getFullYear()
            	    + " " + fnPad(oDate.getHours(), 2) + ":" + fnPad(oDate.getMinutes(), 2) + " GMT";
            };
			
	        /**
	         * Primary WebAPI controller.
	         * @class
	         * @param   {Connection}    oConnection     The HDB connection.
	         * @param   {ErrorHandler}  oErrorHandler   The error handler.
	         */
            function PrimaryController(oConnection, oErrorHandler) {
                /** @protected @type {ErrorHandler} */
                this.oErrorHandler = oErrorHandler;
                
                /** @protected @type {Connection} */
                this.oConnection = oConnection;
            }
            
            /**
             * Resolves the device ID and the transport ID for a given device name.
             * @private
             * @param {string} sName The device name.
             * @param {object} oErrorHandler The error handler.
             * @returns {object} The device and transport ids.
             */
            fnResolveDevice = function(sName, oErrorHandler) {
            	var result = oDB.querf('SELECT "id", "transport" FROM "{0}"."{1}" WHERE "name" = ?', 
            	    [oConst.Schemas.Main, oConst.Tables.Device], [sName]);
            	if (result.length) {
            		return result[0];
            	} else {
            		oErrorHandler.onError("Unable to find entity by name: " + sName);
            		return {};
            	}
            };
	        
            /**
             * Convenience method for uploading a CSV with locations.
             * @public
             * @param   {string}    sCsv    The CSV file's contents.
             * @param   {boolean}   bHeader Flag indicating if the file has a header line.
             * @returns {void}    
             */
            PrimaryController.prototype.uploadLocations = function(sCsv, bHeader) {
                var aData = oMU.csvToArray(sCsv, bHeader, true);
                oDB.updatf('INSERT INTO "{0}"."{1}" VALUES(?, ?, {2}, ?, ?)',  
                    [oConst.Schemas.Main, oConst.Tables.Location, oConst.BatchStPointConstructor], [aData]);
                this.oConnection.commit();
            };
            
            /**
             * Updates the position of certain rows.
             * @public
             * @param {string}      sTable  The destination table.
             * @param {object[]}    aPairs  An array of "pairs" (id, latitude, longitude).
             * @returns {void}
             */
            PrimaryController.prototype.updateEntityPosition = function(sTable, aPairs) {
                var aData = [];
                if (!aPairs.length) {
                    this.oErrorHandler.onError("Invalid pair data.");
                    return this;
                }
                for (var i = 0; i < aPairs.length; ++i) {
                    if (!aPairs[i].id || isNaN(aPairs[i].latitude) || isNaN(aPairs[i].longitude)) {
                        this.oErrorHandler.onError("Invalid pair data.");
                        return this;
                    }
                    aData.push([aPairs[i].longitude, aPairs[i].latitude, aPairs[i].id]);
                }
                oDB.updatf('UPDATE "{0}"."{1}" SET "position" = {2} WHERE "id" = ?', 
                    [oConst.Schemas.Main, sTable, oConst.BatchStPointConstructor], [aData]);
                this.oConnection.commit();
            };
            
            /**
             * Persists a set of locations in the DB.
             * @private
             * @param {object[]}    aData   An array of objects consisting of the name, latitude, longitude
             *                              country and region.
             * @returns {void}
             */
            PrimaryController.prototype.createLocations = function(aData) {
                var aParsed = [];
                for (var i = 0; i < aData.length; ++i) {
                    if (!aData[i].name || isNaN(aData[i].latitude) || isNaN(aData[i].longitude)) {
                        this.oErrorHandler.onError("Invalid input data.");
                        return;
                    }
                    aParsed.push([$.util.createUuid(), aData[i].name, aData[i].longitude, aData[i].latitude,
                        aData[i].country, aData[i].region]);
                }
                if (aParsed.length > 0) {
                    oDB.updatf('INSERT INTO "{0}"."{1}" VALUES(?, ?, {2}, ?, ?)', 
                        [oConst.Schemas.Main, oConst.Tables.Location, oConst.BatchStPointConstructor], [aParsed]);
                    this.oConnection.commit();
                }
            };
             
            /**
             * Inserts a new reading in the db.
             * @public
             * @param {string} sDeviceName  The name of the device.
             * @param {float}  fLatitude    The latitude of the device.
             * @param {float}  fLongitude   The longitude of the device.
             * @param {int=}   iDate        The number of milis since 1970.
             *
             * @returns {object} The device, transport and reading IDs.
             */
            PrimaryController.prototype.createReading = function(sDeviceName, fLatitude, fLongitude, iDate) {
            	var dDate = iDate ? new Date(iDate) : new Date();
            	if (isNaN(fLatitude) || isNaN(fLongitude)) {
            	    this.oErrorHandler.onError("Illegal latitude or longitude values.");
            		return {};
            	}
            	var oDevice = fnResolveDevice(sDeviceName, this.oConnection);
            	var sReading = $.util.createUuid();
            	oDB.updatf('INSERT INTO "{0}"."{1}" VALUES(?, ?, {2}, ?)', 
            	    [oConst.Schemas.Main, oConst.Tables.Reading, oConst.BatchStPointConstructor], 
            	    [sReading, oDevice.transport, fLongitude, fLatitude, dDate]);
                this.oConnection.commit();
            	return {
            		device: oDevice.id,
            		transport: oDevice.transport,
            		reading: sReading
            	};
            };
            
            /**
             * Reads the relevant sensor properties for a device.
             * @private
             * @param {string}  sDeviceId   The UUID of the device.
             * @returns {object}    A map between the sensor number and the relevant properties.
             */
            fnGetSensors = function(sDeviceId) {
                var i,
            	    oSensors = {},
            	    mMeasures = {},
            	    oSensorData = oDB.querf('SELECT "S"."number", "T"."virtual", "T"."conversion", "L"."lowerBound",'
            	    + ' "L"."upperBound", "M"."id" AS "measure", "M"."name" AS "measureName" FROM "{0}"."{1}" AS "D"'
            	    + ' INNER JOIN "{0}"."{2}" AS "S" ON "D"."id" = "S"."device" AND "D"."id" = ?'
            	    + ' INNER JOIN "{0}"."{3}" AS "T" ON "S"."sensorType" = "T"."id"' 
            	    + ' INNER JOIN "{0}"."{4}" AS  "M" ON "T"."measure" = "M"."id"'
            	    + ' LEFT JOIN "{0}"."{5}" AS "L" ON "L"."transport" = "D"."transport" AND "L"."notified" = 0'
            	    + ' AND "L"."measure" = "M"."id"', 
                    [oConst.Schemas.Main, oConst.Tables.Device, oConst.Tables.DeviceSensor, oConst.Tables.SensorType, 
                    oConst.Tables.Measure, oConst.Tables.Limit], [sDeviceId]),
                    
                    /**
                     * Checks an expression for syntax.
                     * @param   {string}    sExpression The expression to be checked.
                     * @param   {boolean}   bVirtual    Flag indicating if the sensor is virtual.
                     * @returns {boolean}   True if the expression is correct.
                     */
                    fnCheckExpression = function(sExpression, bVirtual) {
                        var sReplaced;
                        if (!sExpression) {
                            return true;
                        }
                        sReplaced = sExpression.replace(
                    	    new RegExp("(" + oConst.MathFunctions.join("|") + ")", "g"), "0"
                    	);
                        if (bVirtual) {
                            sReplaced = sReplaced.replace(oConst.FieldRegex, "0");
                        }
                        return oConst.ExpressionRegex.test(sReplaced);
                    },
                    
                    /**
                     * Prepares an expression. Replaces the math functions with real JS calls.
                     * In case of virtual sensors, the fields are replaced with placeholders.
                     * @param   {string}    sExpression The expression to be checked.
                     * @param   {boolean}   bVirtual    Flag indicating if the sensor is virtual.
                     * @returns {object|string} For virtual sensors, returns an object with two properties: the formula
                     * and the fields of the expression. For other sensors, the formula is directly returned.
                     */
                    fnPrepareExpression = function(sExpression, bVirtual){
                        var sReplaced,
                            aFields,
                            mUsed = {},
                            aResult = [],
                            sName,
                            j;
                        if (!sExpression || !fnCheckExpression(sExpression, bVirtual)) {
                            return null;
                        }
                        sReplaced = sExpression.replace(
                            new RegExp("(" + oConst.MathFunctions.join("|") + ")", "g"), "Math.$1"
                        );
                        if (bVirtual) {
                            aFields = sReplaced.match(oConst.FieldRegex) || [];
                            for (j = 0; j < aFields.length; ++j) {
                                if (mUsed[aFields[j]]) {
                                    continue;
                                }
                                mUsed[aFields[j]] = true;
                                sName = aFields[j].substring(3, aFields[j].length - 1);
                                if (aFields[j].charAt(1) === "S") {
                                    aResult.push({
                                        source: 0,
                                        name:   sName
                                    });
                                }
                                else {
                                    if (mMeasures[sName] !== undefined) {
                                        aResult.push({
                                            source: 1,
                                            sensor: mMeasures[sName]
                                        });
                                    }
                                    else {
                                        return null;
                                    }
                                }
                                sReplaced = sReplaced.replace(
                                    new RegExp(aFields[j].replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
                                    "{" + (aResult.length - 1) + "}"
                                );
                            }
                            return {
                                formula:    sReplaced,
                                fields:     aResult
                            };
                        }
                        else {
                            return sReplaced;
                        }
                    };
                
                for (i = 0; i < oSensorData.length; ++i) {
                    mMeasures[oSensorData[i].measureName] =  oSensorData[i].number;
                }
                for (i = 0; i < oSensorData.length; ++i) {
                    oSensors[oSensorData[i].number] = {
                        number:     oSensorData[i].number,
                        virtual:    oSensorData[i].virtual,
                        expression: fnPrepareExpression(oSensorData[i].conversion, oSensorData[i].virtual),
                        lower:      oSensorData[i].lowerBound,
                        upper:      oSensorData[i].upperBound,
                        measure:    oSensorData[i].measure,
                        measureName:oSensorData[i].measureName,
                        value:      null
                    };
                }
                return oSensors;
            };
            
            /**
             * Sends a POST request to the email service.
             * @param   {object}    oData   The content of the request body.
             * @returns {object}    The response from the mail service.
             */
            fnSendPostToMailService = function(oData) {
                var oDestination,
                    oRequest,
                    oClient;
                oDestination = $.net.http.readDestination("spet.diploma.library", "mail");  
                oClient = new $.net.http.Client();  
                oRequest = new $.net.http.Request($.net.http.POST, "/mail/");
                oRequest.setBody(JSON.stringify(oData));
                return oClient.request(oRequest, oDestination).getResponse(); 
            };
            
            PrimaryController.prototype.sendMail = fnSendPostToMailService;
            
            /**
             * Sends an email notification.
             * @param   {object}    oIds                The ids of the transport and device.
             * @param   {object[]}  aLimitViolations    An array with the information about violated limits.
             * @returns {void}
             */
            fnSendEmail = function(oIds, aLimitViolations) {
                var aLimitUpdates = [],
                    oResult,
                    oMeasure,
                    aContacts = [],
                    oData = oMU.clone(oConst.EmailSettings),
                    i;
                    
                oResult = oDB.querf('SELECT DISTINCT "P"."email" FROM "{0}"."{1}" AS "I" INNER JOIN'
                    + ' "{0}"."{2}" AS "R" on "I"."role" = "R"."id" AND "R"."contact" = 1 AND'
                    + ' "I"."transport" = ? INNER JOIN "{0}"."{3}" AS "P" on "I"."person" = "P"."id"'
                    , [oConst.Schemas.Main, oConst.Tables.Involvement, oConst.Tables.Role,
                    oConst.Tables.Person], [oIds.transport]);
                for (i = 0; i < oResult.length; ++i) {
                    aContacts.push(oResult[i].email);
                }
                if (aContacts.length === 0) {
                    return;
                }
                
                oData.deviceId      = oIds.device;
                oData.transportId   = oIds.transport;
                oData.deviceName    = oDB.querf('SELECT "name" FROM "{0}"."{1}" WHERE "id" = ?',
                    [oConst.Schemas.Main, oConst.Tables.Device], [oIds.device])[0].name;
                oResult = oDB.querf('SELECT "description" FROM "{0}"."{1}" WHERE "id" = ?',
                    [oConst.Schemas.Main, oConst.Tables.Transport], [oIds.transport])[0];
                oData.transportName = oResult.description;
                oData.to            = aContacts.join(","); 
                oData.measures = [];
                oResult = oMU.unwrapGeoJsonPoint(oDB.querf('SELECT "position".ST_asGeoJson() AS "position"' 
                    + 'FROM "{0}"."{1}" WHERE "id" = ?', [oConst.Schemas.Main, oConst.Tables.Reading], 
                    [oIds.reading])[0].position);
                oData.latitude = oResult[1] + "";
                oData.longitude = oResult[0] + "";
                oData.time = fnFormatDate(new Date());
                
                for (i = 0; i < aLimitViolations.length; ++i) {
                    aLimitUpdates.push([oIds.transport, aLimitViolations[i].measure]);
                    oResult = oDB.querf('SELECT "name", "unit" FROM "{0}"."{1}" WHERE "id" = ?',
                        [oConst.Schemas.Main, oConst.Tables.Measure], [aLimitViolations[i].measure]);
                    if (oResult.length) {
                        oResult = oResult[0];
                        oMeasure = {
                            name:   oResult.name,
                            unit:   oResult.unit,
                            value:  aLimitViolations[i].value + ""
                        };
                        if (aLimitViolations[i].lower !== undefined) {
                            oMeasure.lower = aLimitViolations[i].lower + "";
                        }
                        if (aLimitViolations[i].upper !== undefined) {
                            oMeasure.upper = aLimitViolations[i].upper + "";
                        }
                        oData.measures.push(oMeasure);
                    }
                }
                
                if (aLimitUpdates.length) {
                    oDB.updatf('UPDATE "{0}"."{1}" SET "notified" = 1 WHERE "transport" = ? AND "measure" = ?',
                        [oConst.Schemas.Main, oConst.Tables.Limit], [aLimitUpdates]);
                }
                
                fnSendPostToMailService(oData);
            };
            
            /**
             * Gets the system fields for a reading.
             * @param {object}  oIds    The ids of the transport, reading, device, etc.
             * @returns {object} A map of system fields.
             */
            fnGetSystemFields = function(oIds) {
                var oDistance = oDB.querf('SELECT "P"."route".ST_Distance("R"."position", \'meter\') / 1000 AS "distance"'
                    + ' FROM "{0}"."{1}" AS "T" INNER JOIN "{0}"."{2}" AS "R" ON "T"."id" = ? AND "R"."id" = ?'
                    + ' INNER JOIN "{0}"."{3}" AS "P" ON "T"."route" = "P"."id"', [oConst.Schemas.Main, 
                    oConst.Tables.Transport, oConst.Tables.Reading, oConst.Tables.Route], [oIds.transport, oIds.reading]),
                    oOffset = oDB.callProcedure(oConst.Schemas.Main, oConst.Procedures.CheckSchedule, {
                        "iv_transport": oIds.transport,
                        "iv_reading":   oIds.reading
                    });
                return {
                    RouteDeviation:  oDistance && oDistance.length ? oDistance[0].distance : 0,
                    ScheduleDeviation: oOffset.ev_offset
                };
            };
            
            /**
             * Computes the virtual sensor values.
             * @param   {object}    oSensors        The sensors' properties map.
             * @param   {object}    oSystemFields   A map with the system fields.
             * @returns {void}
             */
            fnComputeVirtual = function(oSensors, oSystemFields) {
                var bOk,
                    j,
                    k,
                    aArgs,
                    
                    /**
                     * Retrieves the given fields to be passed as arguments to the expression.
                     * @param   {object[]}  aFields The fields array from the sensor properties.
                     * @returns {number[]|false} Either returns the array of fields of false if some fields are missing.
                     */
                    fnGetArgs = function(aFields) {
                        var aRes = [];
                        for (k = 0; k < aFields.length; ++k) {
                            if (aFields[k].source === 0) {
                                if (oSystemFields[aFields[k].name] === null || isNaN(oSystemFields[aFields[k].name])) {
                                    return false;
                                }
                                else {
                                    aRes.push(oSystemFields[aFields[k].name]);
                                }
                            }
                            else {
                                if (oSensors[aFields[k].sensor] && !isNaN(oSensors[aFields[k].sensor].value)) {
                                    aRes.push(oSensors[aFields[k].sensor].value);
                                }
                                else {
                                    return false;
                                }
                            }
                        }
                        return aRes;
                    },
                    
                    /**
                     * Evaluates an expression.
                     * @param   {string}    sFormula    The expression's formula.
                     * @param   {number[]}  aParams     The expression's parameters.
                     * @returns {number}    The result of the evaluation.
                     */
                    fnEvaluate = function(sFormula, aParams) {
                        var nRes;
                        try {
                            nRes = eval(oMU.formatA(sFormula, aParams));
                            nRes = isNaN(nRes) ? 0 : nRes;
                        }
                        catch(e) {
                            nRes = 0;
                        }
                        return nRes;
                    };
                do {
                    bOk = false;
                    for (j in oSensors) {
                        if (oSensors.hasOwnProperty(j) && oSensors[j].virtual && oSensors[j].expression
                            && oSensors[j].expression.fields && oSensors[j].value === null) {
                            aArgs = fnGetArgs(oSensors[j].expression.fields);
                            var fResult = aArgs ? fnEvaluate(oSensors[j].expression.formula, aArgs) : null;
                            if (fResult !== null && !isNaN(fResult)) {
                                bOk = true;
                                oSensors[j].value = fResult;
                            }
                        }
                    }
                }while(bOk);
            };
                    
            /**
             * Persists a set of values in the DB.
             * @public
             * @param {object}      oIds  The IDs for the reading  and device.
             * @param {object[]}    aData An array of objects consisting of the sensor number and the read value.
             * @returns {void} 
             */
            PrimaryController.prototype.createValues = function(oIds, aData) {
            	if (!aData) {
        		    this.oErrorHandler.onError("Invalid value array.");
        		    return;
            	}
            	
            	var aInsert = [], 
            	    i, 
            	    oSensors  = fnGetSensors(oIds.device),
            	    aLimitViolations = [],
            	    /**
            	     * Converts the value of a sensor. the result is stored in the sensor's properties.
            	     * @param   {object}    oSensor The sensor's properties.
            	     * @param   {float}     fValue  The read value.
            	     * @returns {void}
            	     */
            	    fnConvertValue = function(oSensor, fValue) {
                        if (typeof oSensor.expression === "string") {
                            try {
                                oSensor.value = eval(oSensor.expression.replace(/[#]+/g, fValue));
                                if (isNaN(oSensor.value)) {
                                    oSensor.value = fValue;
                                }
                            }
                            catch(e) {
                                oSensor.value = fValue;
                            }
                        }
                        else {
                            oSensor.value = fValue;
                        }
                    },
                    
                    /**
                     * Checks a sensor against its limit(s) if it has any.
                     * @param   {object}    oSensor The sensor's properties.
                     * @returns {void}
                     */
                    fnCheckLimit = function(oSensor) {
                		if ((oSensor.lower !== null && oSensor.value < oSensor.lower) 
                		    || (oSensor.upper !== null && oSensor.value > oSensor.upper)) {
                		    aLimitViolations.push({
                		        value:      oSensor.value,
                		        measure:    oSensor.measure,
                		        lower:      oSensor.lower === null ? undefined : oSensor.lower,
                		        upper:      oSensor.upper === null ? undefined : oSensor.upper
                		    });
                		}
                    };
                
            	for (i = 0; i < aData.length; ++i) {
            		if (isNaN(aData[i].value) || isNaN(aData[i].sensor) || !oSensors[aData[i].sensor]) {
            		    this.oErrorHandler.onError("Invalid value array.");
            		    return;
            		}
            		if (oSensors[aData[i].sensor].virtual) {
            		    this.oErrorHandler.onError("Virtual sensor values can not be set this way.");
            		    return;
            		}
            		fnConvertValue(oSensors[aData[i].sensor], aData[i].value);
            	}
            	
            	fnComputeVirtual(oSensors, fnGetSystemFields(oIds));
            	
            	for (i in oSensors) {
            	    if (oSensors.hasOwnProperty(i) && oSensors[i].value !== null) {
            	        fnCheckLimit(oSensors[i]);
            		    aInsert.push([oIds.reading,  oIds.device, i, oSensors[i].value]);
            	    }
            	}
            	
            	oDB.updatf('INSERT INTO "{0}"."{1}" VALUES (?, ?, ?, ?)', [oConst.Schemas.Main, oConst.Tables.Value], 
            	    [aInsert]);
                this.oConnection.commit();
                
                if (aLimitViolations.length > 0) {
                    fnInsertEvent(oIds, aLimitViolations);
                    this.oConnection.commit();
                }
            };
            
            /**
             * Helper method for inserting an event.
             * @param   {object}    oIds                The ID object (holds the transport, reading ids).
             * @param   {object[]}  aLimitViolations    An array containing violated limits.
             * @returns {void}
             */
            fnInsertEvent = function(oIds, aLimitViolations) {
                var aTraces = oDB.querf('SELECT "id" FROM "{0}"."{1}" WHERE "transport" = ?', 
                    [oConst.Schemas.Main, oConst.Tables.Trace], [oIds.transport]),
                    i,
                    aLimitUpdates = [];
                    
                for (i = 0; i < aTraces.length; ++i) {
                    oDB.updatf('INSERT INTO "{0}"."{1}" VALUES(SYSUUID, ?, ?, ?)', 
                        [oConst.Schemas.Main, oConst.Tables.TraceEvent], ['', aTraces[i].id, oIds.reading]);
                }
                
                for (i = 0; i < aLimitViolations.length; ++i) {
                    aLimitUpdates.push([oIds.transport, aLimitViolations[i].measure]);
                }
                if (aLimitUpdates.length) {
                    oDB.updatf('UPDATE "{0}"."{1}" SET "notified" = 1 WHERE "transport" = ? AND "measure" = ?',
                        [oConst.Schemas.Main, oConst.Tables.Limit], [aLimitUpdates]);
                }
            };
            
            /**
             * Helper method which processes the retrieved data from the procedures.
             * @private
             * @param {object}  oData   Procedure result.
             * @returns {object[]}  An object ready to be stringified (and output to the response).
             */
            fnProcessPositionData = function(oData) {
                var aData = [], i;
                for (i = 0; i < oData.length; ++i) {
                    aData.push({
                        label:      oData[i].label,
                        type:       oData[i].type,
                        position:   oMU.unwrapGeoJsonPoint(oData[i].position),
                        reference:  oData[i].reference,
                        child:      oData[i].child
                    });
                }
                return aData;
            };
            
            /**
             * Retrieve the current positions for all places.
             * @public
             * @param   {int}   iTimestamp  Timestamp (milis).
             * @returns {object[]}  The current positions.
             */
            PrimaryController.prototype.getCurrentPositions = function(iTimestamp) {
                var oDate = iTimestamp ? new Date(iTimestamp) : new Date();
                return fnProcessPositionData(
                    oDB.callProcedure(
                        oConst.Schemas.Main, oConst.Procedures.GetPositionsByDate,  {"iv_date": oDate}
                    ).et_data
                );
            };
            
            /**
             * Retrieve the positions of the "places" that have changed since last query.
             * @public
             * @param   {int}   iPreviousTs Timestamp (milis) of the previous call.
             * @param   {int}   iCurrentTs  Timestamp (milis) of the current call. 
             * @returns {object[]}  The current positions.
             */
            PrimaryController.prototype.getDeltaPositions = function(iPreviousTs, iCurrentTs) {
                return fnProcessPositionData(
                    oDB.callProcedure(
                        oConst.Schemas.Main, oConst.Procedures.GetPositionsDelta, 
                        {"iv_previous": new Date(iPreviousTs), "iv_current": new Date(iCurrentTs)}
                    ).et_data
                );
            };
            
            /**
             * Retrieves the cordinates for the given locations.
             * @param   {string[]}  aLocationIds    The IDs of the necessary locations.
             * @returns {object[]}  The coordinates of the locations.
             */
            PrimaryController.prototype.getLocationCoordinates = function(aLocationIds) {
                var aData = oDB.querf('SELECT "id", "position".ST_AsGeoJson() AS "position"'
                    + ' FROM "{0}"."{1}" WHERE "id" IN ({2})', [oConst.Schemas.Main, oConst.Tables.Location, 
                    oMU.buildArrayOfElement(aLocationIds.length, "?").join(",")], aLocationIds),
                    aResult = {},
                    i;
                for (i = 0; i < aData.length; ++i) {
                    aResult[aData[i].id] = {
                        position: oMU.unwrapGeoJsonPoint(aData[i].position),
                        id: aData[i].id
                    };
                }
                return aResult;
            };
            
            /**
             * Creates a new route and its corresponding legs.
             * @param   {string}    sRouteName  The name of the new route.
             * @param   {string[]}  aWaypoints  The waypoint location IDs in the route order.
             * @param   {string}    sLineString A string with all the points of the route's path.
             * @returns {string}    The new route's ID.
             */
            PrimaryController.prototype.createRoute = function(sRouteName, aWaypoints, sLineString) {
                if (!aWaypoints || aWaypoints.length < 2 || !sRouteName) {
                    this.oErrorHandler.onError("Invalid parameters");
                    return {};
                }
                
                var sNewId = $.util.createUuid(),
                    aLegs = [],
                    i;
                for (i = 1; i < aWaypoints.length; ++i) {
                    aLegs.push([sNewId, i - 1, aWaypoints[i - 1], aWaypoints[i]]);
                }
                
                oDB.updatf('INSERT INTO "{0}"."{1}" VALUES(?, ?, ?, ?, NEW ST_LINESTRING(?, ?))', 
                    [oConst.Schemas.Main, oConst.Tables.Route], [sNewId, sRouteName, aWaypoints[0], 
                    aWaypoints[aWaypoints.length - 1], sLineString, oConst.DefaultSrid]);
                if (aLegs.length) {
                    oDB.updatf('INSERT INTO "{0}"."{1}" VALUES(?, ?, ?, ?)', 
                        [oConst.Schemas.Main, oConst.Tables.RouteLeg], [aLegs]);
                }
                
                this.oConnection.commit();
                return sNewId;
            };
            
            /**
             * Creates a new schedule and its corresponding leg durations.
             * @param   {object}    oParams     The parameters wrapper object.
             * @param   {string}    oParams.route   The Id of the parent route.
             * @param   {string}    oParams.name    The schedule name.
             * @param   {string}    oParams.name    The schedule's comment.
             * @param   {object[]}  oParams.legs    The array of leg durations.
             * @param   {integer}   oParams.legs.sequence   The sequence number of the leg.
             * @param   {integer}   oParams.legs.duration   The duretion of the leg in minutes.
             * @returns {string}    The new schedule's ID.
             */
            PrimaryController.prototype.createSchedule = function(oParams) {
                var sNewId = $.util.createUuid(),
                    aLegs = [],
                    i;
                for (i = 0; i < oParams.legs.length; ++i) {
                    aLegs.push([sNewId, oParams.route, oParams.legs[i].sequence, oParams.legs[i].duration]);
                }
                
                oDB.updatf('INSERT INTO "{0}"."{1}" VALUES(?, ?, ?, ?)', [oConst.Schemas.Main, 
                    oConst.Tables.Schedule], [sNewId, oParams.route, oParams.name, oParams.comment]);
                if (aLegs.length) {
                    oDB.updatf('INSERT INTO "{0}"."{1}" VALUES(?, ?, ?, ?)', 
                        [oConst.Schemas.Main, oConst.Tables.LegDuration], [aLegs]);
                }
                
                this.oConnection.commit();
                return sNewId;
            };
            
            /**
             * Updates the path of a route.
             * @param   {string}    sRouteId    The ID of the target route.
             * @param   {string}    sLineString The line string containing the path of the route.
             * @returns {void}
             */
            PrimaryController.prototype.setRoutePath = function(sRouteId, sLineString) {
                oDB.updatf('UPDATE "{0}"."{1}" SET "route" = NEW ST_LINESTRING(?, ?) WHERE "id" = ?',
                    [oConst.Schemas.Main, oConst.Tables.Route], [sLineString, oConst.DefaultSrid, sRouteId]);
                this.oConnection.commit();
            };
            
            /**
             * Gets the route path.
             * @param   {string}    sRouteId    The ID of the route. 
             * @returns {string}    The sequence of points which make up the route.
             */
            PrimaryController.prototype.getRoutePath = function(sRouteId) {
                return oDB.querf('SELECT "route".ST_asGeoJSON() AS "route" FROM "{0}"."{1}" WHERE "id" = ?',
                    [oConst.Schemas.Main, oConst.Tables.Route], [sRouteId])[0].route;
            };
             
            /**
             * Gets the transport's route path.
             * @param   {string}    sTransportId    The ID of the transport. 
             * @returns {string}    The sequence of points which make up the route.
             */
            PrimaryController.prototype.getTransportRoute = function(sTransportId) {
                return oDB.querf('SELECT "R"."route".ST_asGeoJSON() AS "route" FROM "{0}"."{1}" AS "T"'
                    + ' INNER JOIN "{0}"."{2}" AS "R" ON "R"."id" = "T"."route" AND "T"."id" = ?',
                    [oConst.Schemas.Main, oConst.Tables.Transport, oConst.Tables.Route], [sTransportId])[0].route;
            };
            
            /**
             * Retrieves the waypoints (in order) for the given entity.
             * @param   {string}    sReferenceType  The type of the given entity (either Route or Transport).
             * @param   {string}    sReferenceId    The ID of the given entity.
             * @returns {object[]}  The details of the associated waypoints.
             */
            PrimaryController.prototype.getWaypoints = function(sReferenceType, sReferenceId) {
                var sView = sReferenceType === oConst.Entities.Route ? 
                        oConst.Views.RouteWaypoints : oConst.Views.TransportWaypoints,
                    sIdColumn = sReferenceType === oConst.Entities.Route ? "route" : "transport",
                    i,
                    aResult = [],
                    oResult = oDB.querf('SELECT "L"."id", "L"."name", "L"."position".ST_asGeoJson()'
                        + ' AS "position" FROM "{0}"."{1}" AS "V" INNER JOIN "{0}"."{2}" AS "L"'
                        + 'ON "V"."waypoint" = "L"."id" AND "{3}" = ? ORDER BY "V"."sequence"', 
                        [oConst.Schemas.Main, sView, oConst.Tables.Location, sIdColumn], [sReferenceId]);
                for (i = 0; i < oResult.length; ++i) {
                    aResult.push({
                        id:         oResult[i].id,
                        name:       oResult[i].name,
                        position:   oMU.unwrapGeoJsonPoint(oResult[i].position)
                    });
                }
                return aResult;
            };
            
            
            /**
             * Imports a list of readings givene as a CSV string.
             * The format of the CSV should be as follows:
             * [sep=<separator>]
             * device,date,latitude,longitude[,<sensor numbers>]
             * [<one line per reading, containing the fields as in the above header>]
             * @param {string}  sCsv    The CSV file as a string.
             * @returns {void}
             */
            PrimaryController.prototype.importReadings = function(sCsv) {
                var aData = oMU.csvToArray(sCsv),
                    aValues,
                    oIds,
                    j,
                    i;
                for (i = 1; i < aData.length; ++i) {
                    oIds = this.createReading(
                        aData[i][0] || "Tony", 
                        parseFloat(aData[i][2]),
                        parseFloat(aData[i][3]), 
                        Date.parse(aData[i][1])
                    );
                    aValues = [];
                    for (j = 4; j < aData[i].length; ++j) {
                        aValues.push({
                            sensor: parseInt(aData[0][j], 10),
                            value:  parseFloat(aData[i][j])
                        });
                    }
                    this.createValues(oIds, aValues);
                }    
            };
            
            return PrimaryController;
	    }
	);
}

/**
 * Modification exit for generating a new UUID.
 * @param {object} oParam    - Parameter passed by the OData framework.
 * @returns {void}
 */
function beforeCreate(oParam) {
    oParam.connection.prepareStatement('UPDATE "' + oParam.afterTableName + '" SET "id" = SYSUUID').executeUpdate();
}
