package diploma.android.client;

import android.location.Location;
import com.google.android.gms.location.LocationListener;
import android.os.Bundle;

/**
 * A very basic location listener. Holds a reference to the last location read.
 */
public class SimpleLocationListener implements LocationListener {
    /**
     * The last location reported by the location service.
     */
    private Location lastLocation;

    /**
     * Constructs a simple listener based on the location provider.
     */
    public SimpleLocationListener() {
        lastLocation = new Location("");
        lastLocation.setLatitude(0);
        lastLocation.setLongitude(0);
    }

    @Override
    public void onLocationChanged(Location location) {
        if (location != null) {
            lastLocation.set(location);
        }
    }

    /**
     * Valuator class for retrieving the latitude.
     */
    private class LatitudeValuator implements ScalarValuator {
        @Override
        public String getValueAsString() {
            return SimpleLocationListener.this.lastLocation.getLatitude() + "";
        }

        @Override
        public long getValueAsLong() {
            return (long)SimpleLocationListener.this.lastLocation.getLatitude();
        }

        @Override
        public double getValueAsDouble() {
            return SimpleLocationListener.this.lastLocation.getLatitude();
        }
    }

    /**
     * Valuator class for retrieving the longitude.
     */
    private class LongitudeValuator implements ScalarValuator {
        @Override
        public String getValueAsString() {
            return SimpleLocationListener.this.lastLocation.getLongitude() + "";
        }

        @Override
        public long getValueAsLong() {
            return (long)SimpleLocationListener.this.lastLocation.getLongitude();
        }

        @Override
        public double getValueAsDouble() {
            return SimpleLocationListener.this.lastLocation.getLongitude();
        }
    }

    /**
     * Gets a valuator for the latitude.
     * @return A valuator which can be used to obtain the latest latitude.
     */
    public ScalarValuator getLatitude() {
        return new LatitudeValuator();
    }

    /**
     * Gets a valuator for the longitude.
     * @return A valuator which can be used to obtain the latest longitude.
     */
    public ScalarValuator getLongitude() {
        return new LongitudeValuator();
    }
}
