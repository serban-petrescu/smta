/* global google */
sap.ui.define([
	"sap/ui/core/Control",
	"sap/ui/core/HTML",
	"sap/ui/Device"
], function(Control, HTML, Device) {
	"use strict";

	return Control.extend("diploma.tracking.trace.controller.Map", {
	    metadata: {
	        properties: {
				width: {type: "sap.ui.core.CSSSize", defaultValue: "100%"},
				height: {type: "sap.ui.core.CSSSize", defaultValue: "100%"},
				zoom:   {type: "int", defaultValue: 4},
				latitude: {type: "any", defaultValue: 0},
				longitude: {type: "any", defaultValue: 0},
				type: {type: "string"}
	        },
	        aggregations: {
	            "_html": {
	                type:       "sap.ui.core.HTML",
	                visibility: "hidden",
	                multiple:   false
	            },
	            "markers": {
	                type:           "diploma.tracking.trace.controller.Marker",
	                multiple:       true,
	                singularName:   "marker"
	            },
	            "polylines": {
	                type:           "diploma.tracking.trace.controller.Polyline",
	                multiple:       true,
	                singularName:   "polyline"
	            },
	            "sceneObjects": {
	                type:           "diploma.tracking.trace.controller.Marker",
	                multiple:       true,
	                singularName:   "sceneObject"
	            }
	        }
	    },
	    
	    init: function() {
	        var oHtml = new HTML({
				content: '<div style="height:' + this.getHeight() + ';width:' + this.getWidth() + '"/></div>'
			});
			this.setAggregation("_html", oHtml);
			oHtml.attachAfterRendering(function(){
			    if (!this._map && oHtml.getDomRef()) {
    	            this._map = new google.maps.Map(oHtml.getDomRef(), {
    	                center: new google.maps.LatLng({lat: parseFloat(this.getLatitude() || 0), lng: parseFloat(this.getLongitude() || 0)}), 
    	                zoom:   this.getZoom() || 4,
    	                mapTypeId: this.getType() || "hybrid"	
    	            });
    	            this._deferred.resolve(this._map);
    	        }
			}, this);
			this._deferred = jQuery.Deferred();
			Device.resize.attachHandler(this.resize, this);
	    },
	    
	    resize: function() {
	    	var fnExecute = function() {
	    			google.maps.event.trigger(this._map, "resize");
		        	this._map.setCenter(new google.maps.LatLng({lat: this.getLatitude() || 0, lng: this.getLongitude() || 0}));
	    		}.bind(this);
	    	this.getMap().then(fnExecute);
	    },
	    
	    getMap: function() {
	        return this._deferred.promise();
	    },
	    
		setHeight: function(sValue) {
			this.setProperty("height", sValue, true);
			this.getAggregation("_html").setContent('<div style="height:' + this.getHeight() + ';width:' + this.getWidth() + '"></div>');
		},
		
		setWidth: function(sValue) {
			this.setProperty("width", sValue, true);
			this.getAggregation("_html").setContent('<div style="height:' + this.getHeight() + ';width:' + this.getWidth() + '"/></div>');
		},
		
		setLongitude: function(sValue) {
		    var fValue = parseFloat(sValue);
		    this.setProperty("longitude", fValue);
		    if (this._map) {
		        this._map.setCenter(new google.maps.LatLng({lat: this.getLatitude() || 0, lng: fValue || 0}));
		    }
		},
		
		setLatitude: function(sValue) {
		    var fValue = parseFloat(sValue);
		    this.setProperty("latitude", fValue);
		    if (this._map) {
		        this._map.setCenter(new google.maps.LatLng({lat: fValue || 0, lng: this.getLongitude() || 0}));
		    }
		},
		
		setZoom: function(iValue) {
		    this.setProperty("zoom", iValue || 4);
		    if (this._map) {
		        this._map.setZoom(iValue);
		    }
		},
		
		setType: function(sType) {
		    this.setProperty("type", sType);
		    if (this._map) {
		        this._map.setMapTypeId(sType || "hybrid");
		    }
		},
			
		renderer : function (oRM, oControl) {
			oRM.write("<div");
			oRM.writeControlData(oControl);
			oRM.addStyle("height", "100%");
			oRM.addStyle("width", "100%");
			oRM.writeStyles();
			oRM.write(">");
			oRM.renderControl(oControl.getAggregation("_html"));
			oRM.write("</div>");
		}
	});
});