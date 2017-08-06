/* global google */
sap.ui.define([
	"sap/ui/core/Control"
], function(Control) {
	"use strict";

	return Control.extend("diploma.tracking.trace.controller.Marker", {
	    metadata: {
	        properties: {
	            animation:  {type: "string", defaultValue: null},
	            clickable:  {type: "boolean", defaultValue: false},
	            cursor:     {type: "string"},
	            draggable:  {type: "boolean", defaultValue: false},
	            icon:       {type: "string"},
	            label:      {type: "string"},
	            opacity:    {type: "float", defaultValue: 1},
	            latitude:   {type: "any", defaultValue: 0},
	            longitude:  {type: "any", defaultValue: 0},
	            title:      {type: "string"},
	            visible:    {type: "boolean", defaultValue: true},
	            zIndex:     {type: "int", defaultValue: 0}
	        }    
	    },
	    
	    init: function() {
	        this._marker = new google.maps.Marker();
	    },
	    
	    setParent: function(oParent) {
	        var oMarker = this._marker;
	        Control.prototype.setParent.apply(this, arguments);
	        if (oParent && oParent.getMap) {
	            oParent.getMap().then(function(oMap){
	                oMarker.setMap(oMap);
	            });
	        }
	        else {
	            this._marker.setMap(null);
	        }
	    },
	    
	    setAnimation: function(sValue) {
	        this.setProperty("animation", sValue);
	        this._marker.setAnimation(sValue);
	    },
	    
	    setClickable: function(bValue) {
	        this.setProperty("clickable", bValue);
	        this._marker.setClickable(bValue);
	    },
	    
	    setCursor: function(sValue) {
	        this.setProperty("cursor", sValue);
	        this._marker.setCursor(sValue);
	    },
	    
	    setDraggable: function(bValue) {
	        this.setProperty("draggable", bValue);
	        this._marker.setDraggable(bValue);
	    },
	    
	    setIcon: function(sValue) {
	    	if (sValue && sValue.indexOf("/") < 0) {
	    		sValue = jQuery.sap.getModulePath("diploma.tracking.trace.images", "/" + sValue);
	    	}
	        this.setProperty("icon", sValue);
	        this._marker.setIcon(sValue);
	    },
	    
	    setLabel: function(sValue) {
	        this.setProperty("label", sValue);
	        this._marker.setLabel(sValue);
	    },
	    
	    setOpacity: function(fValue) {
	        this.setProperty("opacity", fValue);
	        this._marker.setOpacity(fValue);
	    },
	   
	    setTitle: function(sValue) {
	        this.setProperty("title", sValue);
	        this._marker.setTitle(sValue);
	    },
	    
	    setVisible: function(bValue) {
	        this.setProperty("visible", bValue);
	        this._marker.setVisible(bValue);
	    },
	    
	    setZIndex: function(iValue) {
	        this.setProperty("zIndex", iValue);
	        this._marker.setZIndex(iValue);
	    },
	    
	    setLatitude: function(fLatitude) {
	        fLatitude = parseFloat(fLatitude);
	        this.setProperty("latitude", fLatitude);
	        this._marker.setPosition(new google.maps.LatLng({
	            lat:    fLatitude,
	            lng:    this.getLongitude()
	        }));
	    },
	    
	    setLongitude: function(fLongitude) {
	        fLongitude = parseFloat(fLongitude);
	        this.setProperty("longitude", fLongitude);
	        this._marker.setPosition(new google.maps.LatLng({
	            lat:    this.getLatitude(),
	            lng:    fLongitude
	        }));
	    },
	    
	    renderer: {}
	});
});