sap.ui.define([
	"sap/ui/core/Element"
], function(Element) {
	"use strict";
	
	/**
	 * Base class for markers. Only holds simple properties with no logic attached.
	 * @class
	 * @name MarkerBase
	 */
	return Element.extend("diploma.tracking.overview.controller.MarkerBase", {
		metadata: {
			properties: {
				key:		{type: "string", defaultValue: undefined},
				detailKey:	{type: "string", defaultValue: undefined},
				title:		{type: "string", defaultValue: undefined},
				icon:		{type: "sap.ui.core.URI", defaultValue: undefined},
				latitude:	{type: "float", defaultValue: undefined},
				longitude:	{type: "float", defaultValue: undefined},
				visible:	{type: "boolean", defaultValue: undefined}
			}
		}
	});
});