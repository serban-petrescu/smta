function define(fnDefine) {
	"use strict";
	fnDefine([
	        "./constants",
	        "./../common/dbUtils"
	    ], [
	        "$/hdb/Connection",
	        "./../common/ErrorHandler"
	    ],
		function(oConst, oDB) {

			/**
			 * NGUW Demo WebAPI controller.
			 * @class
			 * @param   {Connection}    oConnection     The HDB connection.
			 * @param   {ErrorHandler}  oErrorHandler   The error handler.
			 */
			function DemoController(oConnection, oErrorHandler) {
				/** @protected @type {ErrorHandler} */
				this.oErrorHandler = oErrorHandler;

				/** @protected @type {Connection} */
				this.oConnection = oConnection;
			}
			
			DemoController.prototype.interpolatePointsForRoute = function(sRoute, iPointCount) {
			    var aPoints = JSON.parse(oDB.querf('SELECT "route".ST_AsGeoJson() AS "route" FROM "{0}"."{1}"'
			        + ' WHERE "id" = ?', [oConst.Schemas.Main, oConst.Tables.Route], [sRoute])[0].route).coordinates,
			        fLength = 0,
			        fInterval,
			        aResult = [],
			        fPointPosition = 0,
			        fPrevSegmentsLength = 0,
			        fSegmentsLength = 0,
			        iCurrentSegment = 0,
			        fnGetDistanceBetween = function(oA, oB) {
			           return Math.sqrt((oA[0] - oB[0]) * (oA[0] - oB[0]) + (oA[1] - oB[1]) * (oA[1] - oB[1])); 
			        },
			        fnInterpolate = function(oA, oB, fD) {
			            var d0 = oB[0] - oA[0],
			                d1 = oB[1] - oA[1],
			                len = Math.sqrt(d0 * d0 + d1 * d1);
			            return [oA[0] + d0 / len * fD, oA[1] + d1 / len * fD];
			        },
			        i;
			    for (i = 0; i < aPoints.length - 1; ++i) {
			        fLength += fnGetDistanceBetween(aPoints[i], aPoints[i + 1]);
			    }
			    fInterval = fLength / (iPointCount - 1);
			    fSegmentsLength = fnGetDistanceBetween(aPoints[0], aPoints[1]);
			    
                for (i = 0; i < iPointCount; i++)
                {
                    while (fPointPosition > fSegmentsLength && iCurrentSegment < aPoints.length - 2) {
                       iCurrentSegment++;
                       fPrevSegmentsLength = fSegmentsLength;
                       fSegmentsLength += fnGetDistanceBetween(aPoints[iCurrentSegment], aPoints[iCurrentSegment + 1]);
                    }
                    if (iCurrentSegment >= aPoints.length - 1) {
                        break;
                    }
                    aResult.push(fnInterpolate(aPoints[iCurrentSegment], aPoints[iCurrentSegment + 1], fPointPosition - fPrevSegmentsLength));
                    fPointPosition += fInterval;
                }
                return "sep=;\nlatitude;longitude\n" + aResult.map(function(oP){ return oP[1] + ";" + oP[0];}).join("\n");
			};

			DemoController.prototype.push = function() {
				var oDestination, 
				    oClient, 
				    oRequest,
				    oResponse;
				    
				oDestination = $.net.http.readDestination("spet.diploma.library", "external");
				oClient = new $.net.http.Client();
				oRequest = new $.net.http.Request($.net.http.GET, "/");
				oResponse = oClient.request(oRequest, oDestination).getResponse();
				return oResponse.body.asString();
			};
			
			DemoController.prototype.readTrace = function(sTraceId) {
				var oTrace = oDB.querf('SELECT * FROM "{0}"."{1}" WHERE "id" = ?', 
				        [oConst.Schemas.Main, oConst.Tables.Trace], [sTraceId]),
					aReadings = oDB.querf('SELECT "measure", "reading", "value", "timestamp", ' +
						' "position".ST_Y() as "latitude", "position".ST_X() as "longitude" ' + ' FROM "{0}"."{1}" WHERE "transport" = ? ORDER BY "reading"', [
							oConst.Schemas.Main, oConst.Views.MeasuredReading], [oTrace[0].transport]),
					aEvents = oDB.querf('SELECT * FROM "{0}"."{1}" WHERE "trace" = ? ORDER BY "reading"', 
					    [oConst.Schemas.Main, oConst.Tables.TraceEvent], [
						sTraceId]),
					aResults = [],
					oEvents = {},
					sPrevious,
					oObject,
					fnMakeObject = function(oReading) {
						oObject = {
							reading: oReading.reading,
							timestamp: oReading.timestamp.getTime(),
							latitude: oReading.latitude,
							longitude: oReading.longitude,
							values: {},
							events: oEvents.hasOwnProperty(oReading.reading) ? oEvents[oReading.reading] : undefined
						};
					},
					fnAddValue = function(oReading) {
						oObject.values[oReading.measure] = Number(oReading.value);
					},
					i;

				for (i = 0; i < aEvents.length; ++i) {
					if (oEvents.hasOwnProperty(aEvents[i].reading)) {
						oEvents[aEvents[i].reading].push(aEvents[i]);
					} else {
						oEvents[aEvents[i].reading] = [aEvents[i]];
					}
				}

				if (aReadings.length > 0) {
					fnMakeObject(aReadings[0]);
					fnAddValue(aReadings[0]);
					sPrevious = aReadings[0].reading;
					for (i = 1; i < aReadings.length; ++i) {
						if (sPrevious !== aReadings[i].reading) {
							aResults.push(oObject);
							fnMakeObject(aReadings[i]);
							sPrevious = aReadings[i].reading;
						}
						fnAddValue(aReadings[i]);
					}
					aResults.push(oObject);
				}
				aResults.sort(function(oA, oB) {
					return oA.timestamp - oB.timestamp;
				});
				return aResults;
			};

			return DemoController;
		}
	);
}