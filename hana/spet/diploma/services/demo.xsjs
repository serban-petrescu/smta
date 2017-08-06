/*eslint-disable max-params*/
var oSandbox = $.import("spet.diploma.common", "sandbox").sandbox;
var oThis = oSandbox.immediate([
        "spet/diploma/library/constants",
        "spet/diploma/common/Request",
        "spet/diploma/common/Response"
    ], [
        "spet/diploma/common/Service",
        "spet/diploma/library/DemoController"
    ],
	function(oConst, Request, Response, oService, oController) {
		"use strict";
        var Actions = {
            readTrace:  "trace",
            push:       "push",
            getPoints:  "points"
        };
        
		oService.createMapping()
			.expectMethod(Request.Methods.Get)
			.expectParameter("action", Actions.push)
			.callback(oController.push, oController)
			.returnBody();
			
		oService.createMapping()
			.expectMethod(Request.Methods.Get)
			.expectParameter("action", Actions.readTrace)
			.passParameter("id")
			.callback(oController.readTrace, oController)
			.returnBody();
			
		oService.createMapping()
			.expectMethod(Request.Methods.Get)
			.expectParameter("action", Actions.getPoints)
			.passParameter("id")
			.passParameter("count", "integer")
			.callback(oController.interpolatePointsForRoute, oController)
			.returnBody();
			
		return oService;
	}
);
oThis.execute($.request, $.response);