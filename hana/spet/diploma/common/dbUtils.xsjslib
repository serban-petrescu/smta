function immediate(fnDefine) {
	fnDefine(["./miscUtils"], ["$/hdb/Connection", "./ErrorHandler"], function(oMU, oConnection, oErrorHandler) {
		"use strict";
		var oLoadedProcedures = {};
		return {

			/**
			 * Quotes an identifier.
			 * @param {string=}  sSchema The name of the schema.
			 * @param {string}   sName   The name of the artifact.
			 * @returns {string} A quoted identifier.
			 */
			q: function(sSchema, sName) {
				if (sName) {
					return "\"" + sSchema + "\".\"" + sName + "\"";
				} else {
					return "\"" + sSchema + "\"";
				}
			},

			/**
			 * Calls a stored procedure.
			 * @param {String}      sSchema   The schema of the stored procedure.
			 * @param {String}      sName     The name of the stored procedure.
			 * @returns {Object}    The result of the procedure call.
			 */
			callProcedure: function(sSchema, sName) {
				try {
					var sFullName = sSchema + "." + sName;
					if (!oLoadedProcedures[sFullName]) {
						oLoadedProcedures[sFullName] = oConnection.loadProcedure(sSchema, sName);
					}
					return oLoadedProcedures[sFullName].apply(null, Array.prototype.slice.call(arguments, 2));
				} catch (e) {
					oErrorHandler.onError(e);
				}
			},

			/**
			 * Executes an update sql statement.
			 * @param {String}      sStatement  The SQL statement.
			 * @param {any[]=}      aParams     Prepared statement parameters
			 * @returns {void}
			 */
			update: function(sStatement, aParams) {
				if (!aParams) {
					aParams = [];
				}
				if (!(aParams instanceof Array)) {
					aParams = [aParams];
				}
				try {
					aParams.unshift(sStatement);
					oConnection.executeUpdate.apply(oConnection, aParams);
				} catch (e) {
					oErrorHandler.onError(e);
				}
			},

			/**
			 * Inserts the rows froma  ResultSet into a table.
			 * @param {object}      oResultSet  The result set.
			 * @param {string[]}    aColumns    The columns of the result set.
			 * @param {string}      sTable      The destination table.
			 * @param {bool=}       bTruncate   Whether or not to truncate the table before inserting.
			 * @returns {void}
			 */
			insertFromResultSet: function(oResultSet, aColumns, sTable, bTruncate) {
				if (bTruncate) {
					this.update("TRUNCATE TABLE " + sTable);
				}
				if (!oResultSet || !oResultSet.length) {
					return;
				}
				var aResults = [];
				for (var j = 0; j < oResultSet.length; ++j) {
					var aLine = [];
					for (var i = 0; i < aColumns.length; ++i) {
						if (typeof aColumns[i] === "string") {
							aLine.push(oResultSet[j][aColumns[i]]);
						} 
						else if (aColumns[i].name !== undefined && aColumns[i].defaultValue !== undefined) {
						    aLine.push(oResultSet[j][aColumns[i].name] === undefined ? 
						        aColumns[i].defaultValue : oResultSet[j][aColumns[i].name]);
						}
						else {
							aLine.push(aColumns[i].value);
						}
					}
					aResults.push(aLine);
				}
				var sSql = "INSERT INTO " + sTable + " VALUES( ? ";
				for (var k = 1; k < aColumns.length; ++k) {
					sSql += ", ?";
				}
				sSql += ")";
				this.update(sSql, [aResults]);
			},

			/**
			 * Executes a query sql statement.
			 * @param {String}      sStatement   The SQL statement.
			 * @param {any[]=}      aParams      Prepared statement parameters.
			 * @returns {Object}  The result set
			 */
			query: function(sStatement, aParams) {
				if (!aParams) {
					aParams = [];
				}
				if (!(aParams instanceof Array)) {
					aParams = [aParams];
				}
				try {
					aParams.unshift(sStatement);
					return oConnection.executeQuery.apply(oConnection, aParams);
				} catch (e) {
					oErrorHandler.onError(e);
				}
			},

			/**
			 * Convenience founction for doing a string format + prepared query.
			 * @param {string}  sStatement      The SQL statement.
			 * @param {any[]}   aFormatArgs     The arguments for the format function call.
			 * @param {any[]}   aPreparedArgs   The arguments for the query function call.
			 *
			 * @returns {any} The query result;
			 */
			querf: function(sStatement, aFormatArgs, aPreparedArgs) {
				return this.query(oMU.formatA(sStatement, aFormatArgs), aPreparedArgs);
			},

			/**
			 * Convenience founction for doing a string format + prepared update.
			 *
			 * @param {string}  sStatement      - The SQL statement.
			 * @param {any[]}   aFormatArgs     - The arguments for the format function call.
			 * @param {any[]}   aPreparedArgs   - The arguments for the update function call.
			 *
			 * @returns {any} The update result;
			 */
			updatf: function(sStatement, aFormatArgs, aPreparedArgs) {
				return this.update(oMU.formatA(sStatement, aFormatArgs), aPreparedArgs);
			},

			/**
			 * Import data from a CSV file.
			 * @param {string} sCSV         The contents of the CSV file
			 * @param {string} sDestTable   The DB table where the results should be inserted.
			 * @param {bool}   bHeader      Does the CSV have a header line?
			 * @param {bool}   bTruncate    Should the destination table be trucated?
			 * @returns {object[]} The data which was inserted in the table.
			 */
			importCSV: function(sCSV, sDestTable, bHeader, bTruncate) {
			    var aResults = oMU.csvToArray(sCSV, bHeader, false),
			        i, sSql;
			       
				if (aResults.length) {
    				//truncate the table if needed
    				if (bTruncate) {
    					this.update("TRUNCATE TABLE " + sDestTable);
    				}
    				//insert the data
    				sSql = "INSERT INTO " + sDestTable + " VALUES( ? ";
    				for (i = 1; i < aResults[0].length; ++i) {
    					sSql += ", ?";
    				}
    				sSql += ")";
    				this.update(sSql, [aResults]);
				}
				return aResults;
			}
		};
	});
}