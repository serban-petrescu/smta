SET SCHEMA "SPET_DIPLOMA";

TRUNCATE TABLE "spet.diploma.data::ctxCore.eLocation";
TRUNCATE TABLE "spet.diploma.data::ctxCore.eReading";
TRUNCATE TABLE "spet.diploma.data::ctxCore.eRoute";

INSERT INTO "spet.diploma.data::ctxCore.eLocation"
    SELECT "id", "name", NEW ST_POINT("position", 1000004326), "country", "region" FROM "spet.diploma.data::ctxRaw.eLocation";
    
INSERT INTO "spet.diploma.data::ctxCore.eReading"
    SELECT "id", "transport", NEW ST_POINT("position", 1000004326), "timestamp" FROM "spet.diploma.data::ctxRaw.eReading";
    
INSERT INTO "spet.diploma.data::ctxCore.eRoute"
    SELECT "id", "name", "tFrom", "tTo", ST_GeomFromWkt("route", 1000004326) FROM "spet.diploma.data::ctxRaw.eRoute";