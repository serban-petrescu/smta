/* global google */
sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	"use strict";

	return Control.extend("diploma.tracking.trace.controller.Polyline", {
	    metadata: {
	        properties: {
	        	color:	{type: "string"},
	        	weight: {type: "int"},
	        	opacity: {type: "float"}
	        }    
	    },
	    
	    init: function() {
	        this._poly = new google.maps.Polyline();
	    },
	    
	    setParent: function(oParent) {
	        var oPoly = this._poly;
	        Control.prototype.setParent.apply(this, arguments);
	        if (oParent && oParent.getMap) {
	            oParent.getMap().then(function(oMap){
	                oPoly.setMap(oMap);
	            });
	        }
	        else {
	            this._poly.setMap(null);
	        }
	    },
	    
	    setColor: function(sColor) {
	    	this.setProperty("color", sColor);
	    	this._updateOptions();
	    },
	    
	    setWeight: function(iWeight) {
	    	this.setProperty("weight", iWeight);
	    	this._updateOptions();
	    },
	    
	    setOpacity: function(fOpacity) {
	    	this.setProperty("opacity", fOpacity);
	    	this._updateOptions();
	    },
	    
	    pushPoint: function(fLatitude, fLongitude) {
	    	this._poly.getPath().push(new google.maps.LatLng(fLatitude, fLongitude));
	    },
	    
	    popPoint: function() {
	    	this._poly.getPath().pop();
	    },
	    
	    clearPoints: function() {
	    	this._poly.getPath().clear();
	    },
	    
	    _updateOptions: function() {
	    	this._poly.setOptions({
	    		strokeColor: this.getColor(),
	    		strokeWidth: this.getWeight(),
	    		strokeOpacity: this.getOpacity()
	    	});
	    },
	    
	    renderer: {}
	});
});