package diploma.android.client;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;

/**
 * A basic class which can listen for sensor value changes. The last reported value is stored.
 */
public class SimpleSensorListener implements SensorEventListener {

    /**
     * The last value reported by the sensor.
     */
    private float lastValue = 0;

    /**
     * The sensor number allocated by the user (should be in sync with the configuration on the cloud).
     */
    private int number;

    /**
     * Constructs a simple listener from the sensor number.
     * @param number The sensor number indicated by the user.
     */
    public SimpleSensorListener(int number) {
        this.number = number;
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.values.length > 0) {
            lastValue = event.values[0];
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) { }

    /**
     * A valuator for retrieving the value of the sensor.
     * This valuator has an anomaly: it returns the sensor number for the long-type value queries.
     */
    private class Valuator implements ScalarValuator {
        @Override
        public String getValueAsString() {
            return SimpleSensorListener.this.lastValue + "";
        }

        @Override
        public long getValueAsLong() {
            return SimpleSensorListener.this.number;
        }

        @Override
        public double getValueAsDouble() {
            return SimpleSensorListener.this.lastValue;
        }
    }

    /**
     * Gets a valuator for the value of the sensor.
     * @return The valuator; can be used to obtain the most recent value for the sensor.
     */
    public ScalarValuator getValue() {
        return new Valuator();
    }
}
