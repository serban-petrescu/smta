/*eslint-disable max-params*/
var oSandbox = $.import("spet.diploma.common", "sandbox").sandbox;
var oThis = oSandbox.immediate([
        "spet/diploma/library/constants",
        "spet/diploma/common/Request", 
        "spet/diploma/common/Response"
    ],[
        "spet/diploma/common/Service", 
        "spet/diploma/library/PrimaryController"
    ],
	function(oConst, Request, Response, oService, oController) {
        "use strict";
        var oTrackingCommands = {
            GetCurrentPositions:    "1",
            GetDeltaPositions:      "2"
        };
        
    // Creating entities (POST)
        
        /* Upload location(s) */
        oService.createMapping()
            .expectMethod(Request.Methods.Post)
            .expectParameter("entity", oConst.Entities.Location)
            .expectParameter("upload", true)
            .passBody()
            .passParameterOptional("header", "boolean", false)
            .callback(oController.uploadLocations, oController)
            .returnBody();
            
        /* Create location(s) */
        oService.createMapping()
            .expectMethod(Request.Methods.Post)
            .expectParameter("entity", oConst.Entities.Location)
            .passBody("object")
            .callback(oController.createLocations, oController)
            .returnBody();
            
        /* Create route */
        oService.createMapping()
            .expectMethod(Request.Methods.Post)
            .expectParameter("entity", oConst.Entities.Route)
            .passParameter("name")
            .passParameter("waypoints")
            .passBody("string")
            .callback(function(sRouteName, sWaypoints, sLineString) {
                return oController.createRoute(sRouteName, sWaypoints.split(","), sLineString);
            })
            .returnBody();
            
        /* Create schedule */
        oService.createMapping()
            .expectMethod(Request.Methods.Post)
            .expectParameter("entity", oConst.Entities.Schedule)
            .passBody("object")
            .callback(oController.createSchedule, oController)
            .returnBody();
            
    // Updating entities (PUT)    
            
        /* Update route path */
        oService.createMapping()
            .expectMethod(Request.Methods.Put)
            .expectParameter("entity", oConst.Entities.Route)
            .passParameter("id")
            .passBody("string")
            .callback(oController.setRoutePath, oController)
            .returnBody();
            
        /* Update locations(s) / value(s) position. */
        oService.createMapping()
            .expectMethod(Request.Methods.Put)
            .passBody("object")
            .passParameter("entity", "string", [oConst.Entities.Location, oConst.Entities.Value])
            .callback(function(oBody, sEntity) {
                oController.updateEntityPosition(oConst.Tables[sEntity], oBody);
            	return {
            		status: Response.StatusCodes.NoContent
            	};
            });
        
    // Read entities (GET)
        
        /* Get route path */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("entity", oConst.Entities.Route)
            .passParameter("id")
            .callback(oController.getRoutePath, oController)
            .returnBody();
        
        /* Get transport route */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("entity", oConst.Entities.Transport)
            .passParameter("id")
            .callback(oController.getTransportRoute, oController)
            .returnBody();
            
        /* Get waypoints by reference */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("entity", oConst.Entities.Waypoint)
            .passParameter("reference", "string", [oConst.Entities.Route, oConst.Entities.Transport])
            .passParameter("id")
            .callback(oController.getWaypoints, oController)
            .returnBody();
            
        /* Get location positions */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("entity", oConst.Entities.Location)
            .passParameter("ids")
            .callback(function(sIds) {
                return oController.getLocationCoordinates(sIds.split(","));
            })
            .returnBody();
        
        /* Get current positions*/
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("command", oTrackingCommands.GetCurrentPositions)
            .passParameterOptional("timestamp", "integer")
            .callback(oController.getCurrentPositions, oController)
            .returnBody();
            
        /* Get delta positions*/
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("command", oTrackingCommands.GetDeltaPositions)
            .passParameterOptional("previous", "integer")
            .passParameterOptional("current", "integer")
            .callback(oController.getDeltaPositions, oController)
            .returnBody();
            
		return oService;
	}
);

oThis.execute($.request, $.response);