/*eslint-disable max-params*/
var oSandbox = $.import("spet.diploma.common", "sandbox").sandbox;
var oThis = oSandbox.immediate([],[
        "spet/diploma/common/Service", 
        "spet/diploma/library/PrimaryController"
    ],
	function(oService, oController) {
	    
	    oService.createMapping()
            .callback(function() {
                var oResponse = oController.sendMail({
                    "from":         "sirgulos@gmail.com",
                    "to":           "serban.petr@yahoo.com",
                    "subject":      "Alert: Serban's Diploma",
                    "template":     "limit",
                    "deviceId":     "566D6D76B5685629E10000000A4E731A",
                    "deviceName":   "Device 1",
                    "transportId":  "56697BB680504538E10000000A4E731A",
                    "transportName": "Transport 1",
                    "time":         "01.06.2016, 12:30 CET",
                    "latitude":     "40.718217",
                    "longitude":    "-73.998284",
                    "measures":     [{
                        "name":     "Speed",
                        "unit":     "km/h",
                        "value":    "100",
                        "lower":    "50"
                    },{
                        "name":     "Heat",
                        "unit":     "°C",
                        "value":    "40",
                        "upper":    "10"
                    },{
                        "name":     "Light intensity",
                        "unit":     "cd",
                        "value":    "60",
                        "upper":    "50",
                        "lower":    "10"
                    }]
                });
                if (oResponse.body) {
                    return oResponse.body.asString();
                }
            })
            .returnBody();
            
        return oService;
	}
);

oThis.execute($.request, $.response);