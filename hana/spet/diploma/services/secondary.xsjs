/*eslint-disable max-params*/
var oSandbox = $.import("spet.diploma.common", "sandbox").sandbox;
var oThis = oSandbox.immediate([
        "spet/diploma/library/constants",
        "spet/diploma/common/Request", 
        "spet/diploma/common/Response"
    ],[
        "spet/diploma/common/Service", 
        "spet/diploma/library/SecondaryController",
        "spet/diploma/library/PalController"
    ],
	function(oConst, Request, Response, oService, oController, oPal) {
        "use strict";
        var Actions = {
            Read:       "Read",
            Compare:    "Compare",
            Pal:        "Pal"
        };
        
        /* Execute PAL */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("action", Actions.Pal)
            .callback(oPal.getAlgorithmCount, oPal)
            .returnBody();
            
        /* Execute PAL */
        oService.createMapping()
            .expectMethod(Request.Methods.Post)
            .expectParameter("action", Actions.Pal)
            .passBody("object")
            .callback(oPal.execute, oPal)
            .returnBody();
        
        /* Read statistics. */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("entity", oConst.Entities.Statistics)
            .passParameter("value", "string", ["value", "count", "offset"])
            .passParameter("measure")
            .passParameter("period", "string", ["daily", "monthly"])
            .callback(oController.readStatistics, oController)
            .returnBody();
        
        /* Read values. */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("action", Actions.Read)
            .expectParameter("entity", oConst.Entities.Value)
            .passParameter("transport")
            .passParameter("measure")
            .passParameterOptional("from", "integer")
            .passParameterOptional("to", "integer")
            .callback(oController.readValues, oController)
            .returnBody();
        
        /* Read transport measures. */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("action", Actions.Read)
            .expectParameter("entity", oConst.Entities.Transport)
            .callback(oController.readTransportMeasures, oController)
            .returnBody();
            
        /* Read measure transports. */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("action", Actions.Read)
            .expectParameter("entity", oConst.Entities.Measure)
            .callback(oController.readMeasureTransports, oController)
            .returnBody();
            
        /* Compare transports. */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .expectParameter("action", Actions.Compare)
            .expectParameter("entity", oConst.Entities.Transport)
            .passParameter("measure")
            .passParameterOptional("transports", "string", "")
            .passParameterOptional("align", "integer", [0, 1, 2], 1)
            .passParameterOptional("resolution", "integer", 300)
            .callback(function(sMeasure, sTransports, iAlign, iResolution) {
            	return oController.compareTransports(sMeasure, sTransports.split(","), iAlign, iResolution);
            })
            .returnBody();
             
        /* Build statistics. */
        oService.createMapping()
            .expectMethod(Request.Methods.Post)
            .expectParameter("entity", oConst.Entities.Statistics)
            .passBody("object")
            .callback(oController.buildStatistics, oController)
            .returnBody();
            
		return oService;
	}
);
oThis.execute($.request, $.response);