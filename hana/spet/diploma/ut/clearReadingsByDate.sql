DELETE FROM "SPET_DIPLOMA"."spet.diploma.data::ctxCore.eValue"
    WHERE "reading" IN (
        SELECT "id" FROM "SPET_DIPLOMA"."spet.diploma.data::ctxCore.eReading"
        WHERE "timestamp" > TO_TIMESTAMP('2016-04-01')
    );

DELETE FROM "SPET_DIPLOMA"."spet.diploma.data::ctxCore.eReading"
    WHERE "timestamp" > TO_TIMESTAMP('2016-04-01')
