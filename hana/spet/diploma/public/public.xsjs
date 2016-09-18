/*eslint-disable max-params*/
var oSandbox = $.import("spet.diploma.common", "sandbox").sandbox;
oSandbox.setInstance("$/hdb/Connection", $.hdb.getConnection({
    "sqlcc": "spet.diploma.public::anonymous", 
    "pool": true
}));
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
        
        /* Import readings */
        oService.createMapping()
            .expectMethod(Request.Methods.Post)
            .expectParameter("import", "true")
            .passBody("string")
            .callback(oController.importReadings, oController)
            .returnBody();
        
        /* Create reading and values*/
        oService.createMapping()
            .expectMethod(Request.Methods.Post)
            .passBody("object")
            .callback(function(oData){
                if (!oData || !oData.device || !oData.position || !oData.values) {
                    throw "Mandatory parameter(s) are missing from the request.";
                }
                var oIds = oController.createReading(oData.device, oData.position.latitude, 
                    oData.position.longitude, oData.date);
                oController.createValues(oIds, oData.values);
                return {
                    status: Response.StatusCodes.NoContent
                };
            });
        
        /* Ping service */
        oService.createMapping()
            .expectMethod(Request.Methods.Get)
            .callback(function(){})
            .returnBody();
        
		return oService;
	}
);

oThis.execute($.request, $.response);