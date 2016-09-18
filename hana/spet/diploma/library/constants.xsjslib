var Schemas = {
    Main:   "SPET_DIPLOMA",
    Sys:    "SYS"
};
 
var Types = {
    ArimaModel:         "spet.diploma.data::ctxPal.styArimaModel",
    ArimaResults:       "spet.diploma.data::ctxPal.styArimaResult",
    ForecastInput:      "spet.diploma.data::ctxPal.styForecastInput",
    ForecastResult:     "spet.diploma.data::ctxPal.styForecastResult",
    ForecastSmoothingResult:     "spet.diploma.data::ctxPal.styForecastSmoothingResult",
    ForecastSmoothingParams:     "spet.diploma.data::ctxPal.styForecastSmoothingParams",
    ForecastStatistics: "spet.diploma.data::ctxPal.styForecastStatistics",
    Signature:          "spet.diploma.data::ctxPal.stySignature",
    Control:            "spet.diploma.data::ctxPal.styControl",
    SeasonalityResult:  "spet.diploma.data::ctxPal.stySeasonalityResult",
    TestResult:         "spet.diploma.data::ctxPal.styTestResult",
    WhiteNoise:         "spet.diploma.data::ctxPal.styWhiteNoise"
};

var Tables = {
    Device:         "spet.diploma.data::ctxCore.eDevice",
    DeviceSensor:   "spet.diploma.data::ctxCore.eDeviceSensor",
    Reading:        "spet.diploma.data::ctxCore.eReading",
    Value:          "spet.diploma.data::ctxCore.eValue",
    Measure:        "spet.diploma.data::ctxCore.eMeasure",
    MeasuredValue:  "spet.diploma.data::ctxCore.vMeasuredValues",
    SensorType:     "spet.diploma.data::ctxCore.eSensorType",
    Transport:      "spet.diploma.data::ctxCore.eTransport",
    Location:       "spet.diploma.data::ctxCore.eLocation",
    Limit:          "spet.diploma.data::ctxCore.eLimit",
    Route:          "spet.diploma.data::ctxCore.eRoute",
    RouteLeg:       "spet.diploma.data::ctxCore.eRouteLeg",
    Schedule:       "spet.diploma.data::ctxCore.eSchedule",
    LegDuration:    "spet.diploma.data::ctxCore.eLegDuration",
    Person:         "spet.diploma.data::ctxCore.ePerson",
    Involvement:    "spet.diploma.data::ctxCore.eInvolvement",
    Role:           "spet.diploma.data::ctxCore.eRole",
    Organization:   "spet.diploma.data::ctxCore.eOrganization"
};

var Views = {
    MeasuredValue:      "spet.diploma.data::ctxCore.vMeasuredValues",
    DailyViolations:    "spet.diploma.data::ctxCore.vLimitViolationsDaily",
    MonthlyViolations:  "spet.diploma.data::ctxCore.vLimitViolationsMonthly",
    DailyValues:        "spet.diploma.data::ctxCore.vValuesDaily",
    MonthlyValues:      "spet.diploma.data::ctxCore.vValuesMonthly",
    DeltaValues:        "spet.diploma.model/CV_SERIES_DELTA",
    RouteWaypoints:     "spet.diploma.data::ctxCore.vRouteWaypoints",
    TransportWaypoints: "spet.diploma.data::ctxCore.vTransportWaypoints"
};

var Entities = {
    Device:         "Device",
    Reading:        "Reading",
    Value:          "Value",
    Measure:        "Measure",
    MeasuredValue:  "MeasuredValue",
    SensorType:     "SensorType",
    Transport:      "Transport",
    Location:       "Location",
    Limit:          "Limit",
    Statistics:     "Statistics",
    Route:          "Route",
    RouteLeg:       "RouteLeg",
    Schedule:       "Schedule",
    LegDuration:    "LegDuration",
    Waypoint:       "Waypoint"
};

var Procedures = {
    GetPositionsByDate: "spet.diploma.procedures::getPositionsByDate",
    CompareTransports:  "spet.diploma.procedures::compareTransportsByMeasure",
    GetPositionsDelta:  "spet.diploma.procedures::getPositionsDelta",
    FillGaps:           "spet.diploma.procedures::fillSeriesGaps",
    AflWrapperCreate:   "spet.diploma.procedures::aflWrapperCreate",
    AflWrapperDrop:     "spet.diploma.procedures::aflWrapperDrop",
    CheckSchedule:      "spet.diploma.procedures::checkSchedule"
};

var Functions = {
    EqualizeValues:     "spet.diploma.procedures::equalizeValues"
};

var PlaceTypes = {
    InactiveLocation:       0,
    ActiveLocation:         1,
    Transport:              2
};

var EmailSettings = {
    from:         "firstname.lastname@gmail.com", //replace with a real email address
    subject:      "Alert: Serban's Diploma",
    template:     "limit"  
};

var DefaultSrid = 1000004326;
var BatchStPointConstructor = "NEW ST_POINT(NEW ST_POINT(TO_DECIMAL(?, 9, 6), TO_DECIMAL(?, 9, 6)).ST_asWKT(),"
    + DefaultSrid + ")";
var ExpressionRegex = /^[ #0-9()/*+\-,.]*$/;
var FieldRegex = /\$(M|S)\([0-9a-zA-Z ]+\)/g;
var MathFunctions = ["abs", "acos", "asin", "atan", "atan2", "ceil", 
    "cos", "exp", "floor", "log", "max", "min", "pow", "round", "sin", "sqrt", "tan"];