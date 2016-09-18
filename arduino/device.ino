
#include <SoftwareSerial.h>
#include "TinyGPS.h"

#define DEVICE_NAME "Arduino"
#define STATIC_DELAY 500
#define MAX_GPS_READ_TIME 500
#define READ_INTERVAL 5000
#define SENSOR_COUNT 0

/** The software serial object used to communicate with the bluetooth module. */
SoftwareSerial bluetoothSerial(10, 11);

/** The software serial object used to communicate with the GPS module. */
SoftwareSerial gpsSerial(3, 4);

/** The GPS management object. */
TinyGPS gpsHandler;

/**
* A strucutre used to store sensor values and numbers.
* @property {int}   number  The sensor number.
* @property {float} value   The last read value.
*/
struct sensorValue {
  int number;
  float value;
}values[SENSOR_COUNT];

/**
 * Enumeration used to indicate the state of the HTTP response parsing.
 */
enum State {
  Waiting, StatusLine, HeaderLine, Body
};

/**
 * Global variables used to store the current (last known) latitude / longitude.
 */
float latitude, longitude;

/**
 * The timestamp of the moment in which the last send operation was done.
 */
long lastSend = 0;

/**
 * String used to store the current line obtained from the input.
 */
char input[128];

/**
 * The number of characters read up until now in the current input line.
 */
int count;

/**
 * The current state.
 */
State state;

/**
 * The previously read character.
 */
char previous;

/**
 * Updates the current location by reading the GPS values.
 */
void updateLocation() {
  bool newData = false;

  for (unsigned long start = millis(); millis() - start < MAX_GPS_READ_TIME;)
  {
    while (gpsSerial.available())
    {
      char c = gpsSerial.read();
      Serial.write(c);
      if (gpsHandler.encode(c));
        newData = true;
    }
  }
  if (newData)
  {
    gpsHandler.f_get_position(&latitude, &longitude, NULL);
    if (latitude == TinyGPS::GPS_INVALID_F_ANGLE || longitude == TinyGPS::GPS_INVALID_F_ANGLE) {
      latitude = longitude = 0;
    }
  }
}

/**
 * Updates the sensor values.
 */
void updateSensors() {
  //todo: replace with sensor reading
  for (int i = 0; i < SENSOR_COUNT; ++i) {
    values[i].value = random(0, 100);
  }
}

/**
 * Lifecycle hook used to setup the software serial + the sensors.
 */
void setup() {
  bluetoothSerial.begin(9600);
  gpsSerial.begin(9600);
  for (int i = 0; i < SENSOR_COUNT; ++i) {
    values[i].number = i + 1;
  }
}

/**
 * Initializes the HTTP response parsing input fields.
 */
void initializeInput() {
  state = Waiting;
  count = 0;
}

/**
 * Processes the status line.
 */
void processStatus() {
  input[count] = 0;
  char* pos = strchr(input, ' ');
  if (pos != NULL && (pos - input) < count - 4) {
    int statusCode = (pos[1] - '0') * 100 + (pos[2] - '0') * 10 + (pos[3] - '0');
    if (statusCode == 200 || statusCode == 204) {
      //Success... If we have a serial to log to, write success here
    }
    else {
      //Error
    }
  }
}

/**
 * Processes the available bytes for the serial in. 
 */
void readInput() {
  char current;
  while (bluetoothSerial.available()) {
    if (count >= sizeof(input) / sizeof(char)) {
      count = 0;
    }
    current = (char)bluetoothSerial.read();
    if (current <= 0)
    {
        initializeInput();
    }
    else
    {
        if (state == Waiting)
        {
            state = StatusLine;
        }
        if (current != '\n' && current != '\r')
        {
            input[count++] = current;
        }
        if (current == '\n' && previous == '\r')
        {
            switch (state)
            {
                case StatusLine:
                    processStatus();
                    state = HeaderLine;
                    break;
                case HeaderLine:
                    if (count == 0)
                    {
                      state = Body;
                    }
                    /*else
                    {
                       //process header --> nothing to do
                    }*/
                    break;
                case Body:
                    /* process body --> nothing to do */
                    initializeInput();
                    break;
            }
        }
        previous = current;
    }
  }
}

/**
 * Sends a reading.
 */
void sendReading() {
  bluetoothSerial.write((byte)0);
  bluetoothSerial.write("POST /public/public.xsjs HTTP/1.1\r\n\r\n");
  bluetoothSerial.write("{\"device\":\"");
  bluetoothSerial.write(DEVICE_NAME);
  bluetoothSerial.write("\",\"position\":{");
  bluetoothSerial.write("\"latitude\":");
  bluetoothSerial.print(latitude);
  bluetoothSerial.write(",\"longitude\":");
  bluetoothSerial.print(longitude);
  bluetoothSerial.write("},\"values\":[");
  for (int i = 0; i < SENSOR_COUNT; ++i) {
    bluetoothSerial.write("{\"sensor\":");
    bluetoothSerial.print(values[i].number);
    bluetoothSerial.write(",\"value\":");
    bluetoothSerial.print(values[i].value);
    bluetoothSerial.write("}");
    if (i != SENSOR_COUNT - 1) {
      bluetoothSerial.write(",");
    }
  }
  bluetoothSerial.write("]}\r\n");
  bluetoothSerial.write((byte)0);
}

/**
 * Lifecycle hook which is continously called in a loop.
 * Used to update the sensor /GPS values, read input and check if a Send operation should be dispatched.
 */
void loop() {
  updateSensors();
  updateLocation();
  readInput();
  if (millis() - lastSend >= READ_INTERVAL || lastSend == 0) {
    lastSend = millis();
    sendReading();
  }
  
  delay(STATIC_DELAY);
}
