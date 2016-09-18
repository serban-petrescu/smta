function immediate(fnDefine) {
	fnDefine([], ["./ErrorHandler"], function(oErrorHandler) {
		"use strict";
		var fnClone,
		    fnExtend;
		
		fnExtend = function(oLeft, oRight) {
		    var sKey;
		    for (sKey in oRight) {
		        if (oRight.hasOwnProperty(sKey)) {
		            if (oLeft.hasOwnProperty(sKey) && typeof oLeft[sKey] === "object" && typeof oRight[sKey] === "object") {
	                    fnExtend(oLeft[sKey], oRight[sKey]);
	                }
	                else {
	                    oLeft[sKey] = typeof oRight[sKey] === "object" ? fnClone(oRight[sKey], true) : oRight[sKey];
	                }
		        }
		    }
		    return oLeft;
		};
		
		fnClone = function(oObject, bDeep) {
            var oResult = {};
            for (var sKey in oObject) {
                if (oObject.hasOwnProperty(sKey)) {
                    if (typeof oObject[sKey] === "object" && bDeep) {
                        oResult[sKey] = fnClone(oObject[sKey]);
                    }
                    else {
                        oResult[sKey] = oObject[sKey];
                    }
                }
            }
            return oResult;
		};
		
		var fnToArray = function(oResult, bDeep) {
		    var aResult = [], i;
		    if (typeof oResult === "object" && typeof oResult.length !== undefined) {
		        for (i = 0; i < oResult.length; ++i) {
    	            if (bDeep) {
    	                aResult.push(fnToArray(oResult[i]));
    	            }
    	            else {
    	                aResult.push(oResult[i]);
    	            }
    	        }
	            return aResult;
		    }
		    else {
	            return oResult;
		    }
		};
		
		return {
		    
		    /**
		     * Extends a given object with the properties of another object.
		     * @param   {object}    oLeft       The target object.
		     * @param   {object}    oRight      The source object.
		     * @param   {boolean=}  bInPlace    Indicates whether or not to use the original object or make a copy.
		     * @returns {object}    The extended object (= oLeft if bInPlace is true).
		     */
		    extend: function(oLeft, oRight, bInPlace) {
		        if (oLeft === undefined) {
		            return fnClone(oRight, true);
		        }
		        if (bInPlace) {
		            return fnExtend(oLeft, oRight || {});
		        }
		        else {
		            return fnExtend(fnClone(oLeft, true), oRight || {});
		        }
		    },
		    
		    /**
		     * Transforms an SQL result object into a real array.
		     * @param   {object}    oResult An SQL Result (either from a query or a procedure call).
		     * @param   {boolean=}  bDeep   Whether or not the function should be applied recursively.
		     * @returns {array} An array with the data in the result.
		     */
		    resultToArray: fnToArray,
		    
		    /**
		     * Clones an object.
		     * @param   {object}    oObject The object to be cloned.
		     * @param   {bool=}     bDeep   Whether or not to perfrom a deep clone.
		     * @returns {object}    A new object with the same properties as the original one.
		     */
		    clone: fnClone,
		     
			/**
			 * Formats a string by replacing the placeholders.
			 * @param {string} sFormat      The strign to be formatted.
			 * @param {any[]}  aArguments   Any number of optional arguments.
			 * @returns {string} The formatted string.
			 *
			 * @example format("{0} is {1}", ["JS", "cool"]); //returns "JS is cool"
			 */
			formatA: function(sFormat, aArguments) {
				return sFormat.replace(/{(\d+)}/g,
					function(match, number) {
						return typeof aArguments[number] !== 'undefined' ? aArguments[number] : match;
					}
				);
			},

			/**
			 * Formats a string by replacing the placeholders.
			 * @param {string} sFormat      The strign to be formatted.
			 * @param {...any} varAgs       Any number of optional arguments.
			 * @returns {string} The formatted string.
			 *
			 * @example format("{0} is {1}", "JS", "cool"); //returns "JS is cool"
			 *
			 */
			format: function(sFormat) {
				return this.formatA(sFormat, Array.prototype.slice.call(arguments, 1) || []);
			},
			
            /**
             * @function csvToArray
             * @description Import data from a CSV file.
             * 
             * @param {string} sCSV         The contents of the CSV file
             * @param {bool}   bHeader      Does the CSV have a header line?
             * @param {bool}   bCreateId    Should IDs be created for each line?
             * @returns {Object[]} The data which was inserted in the table. 
             */
            csvToArray: function(sCSV, bHeader, bCreateId) {
                //split the CSV file by lines
                var lines = sCSV.split(/\r\n|\n/);
                if (!lines || lines.length === 0) {
                    return [];
                }
                var index = 0;
                
                //retrieve the separator (, is default)
                var sep = /sep=(.)/.exec(lines[0]);
                if (sep && sep.length > 1) {
                    sep = sep[1];
                    ++index;
                } else {
                    sep = ",";
                }
                
                //skip the header line
                if (bHeader) {
                    ++index;
                }
                
                var columns = -1;
                var result = [];
                for (;index < lines.length; ++index) {
                    
                    if (lines[index].trim().length === 0) {
                        continue;
                    }
                    
                    //split each line by the separator
                    var line = lines[index].split(sep);
                    if (!line || !line.length) {
                        oErrorHandler.onError("Invalid CSV file.");
                        return [];
                    }
                    if (columns === -1) {
                        columns = line.length;
                    }
                    else if (columns !== line.length) {
                        oErrorHandler.onError("Invalid CSV file.");
                        return [];
                    }
                    if (bCreateId) {
                        line.unshift($.util.createUuid());
                    }
                    result.push(line);
                }
                return result;
            },
            
            
            /**
             * @function    unwrapGeoJsonPoint
             * @param   {string}    sGeoJson    The Geo JSON string.
             * @returns {any}       The unwrapped point.
             */
            unwrapGeoJsonPoint: function(sGeoJson) {
                return JSON.parse(sGeoJson).coordinates;
            },
            
            /**
             * Builds the query part for creating a 2D ST_POINT.
             * @param   {float} fFirst  The value of the first dim.
             * @param   {float} fSecond The value of the second dim.
             * @param   {int=}  iSrid   The SRID for the point.
             * @returns {string}    A string which can be used directly in a query,
             */
            buildTwoDimStPoint: function(fFirst, fSecond, iSrid) {
                if (isNaN(fFirst) || isNaN(fSecond)) {
                    throw "Invalid coordinates..";
                }
                if (isNaN(iSrid)) {
                    return this.format("NEW ST_POINT('POINT({0} {1})'", 
                        parseFloat(fFirst), parseFloat(fSecond));
                }
                else {
                    return this.format("NEW ST_POINT('POINT({0} {1})', {2})", 
                        parseFloat(fFirst), parseFloat(fSecond), parseInt(iSrid, 10));
                }
            },
            
            
		    /**
		     * Builds an array of given length, of identical elements.
		     * @param   {integer}   iLength     The length of the array.
		     * @param   {object}    oElement    The element to be added into the array.
		     * @returns {object[]}  The newly built array.
		     */
		    buildArrayOfElement: function(iLength, oElement) {
		        var aArray = [], i;
		        for (i = 0; i < iLength; ++i) {
		            aArray.push(oElement);
		        }
		        return aArray;
		    }

		};
	});
}