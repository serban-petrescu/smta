package diploma.android.client;

import android.content.Context;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.location.Location;
import android.location.LocationManager;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.annotation.Nullable;
import android.util.Log;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.api.GoogleApiClient;
import com.google.android.gms.location.FusedLocationProviderApi;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Manages the listeners attached to the device.
 */
public class ListenerManager implements GoogleApiClient.ConnectionCallbacks,
        GoogleApiClient.OnConnectionFailedListener{
    /**
     * The tag used for the Log.
     */
    private static final String TAG = "DATACOLLECTION";

    /**
     * The currently attached valuators.
     */
    private List<ScalarValuator> valuators;

    /**
     * The sensor manager.
     */
    private SensorManager sensorManager;

    /**
     * The header line of the import-ready CSV file. Will contain the sensor numbers.
     */
    private String headerLine;

    /**
     * The list of listeners which are attached to sensors.
     */
    private List<SimpleSensorListener> sensorListeners;

    /**
     * The listener which is attached to the location service.
     */
    private SimpleLocationListener locationListener;

    /**
     * The device name given by the user.
     */
    private String deviceName;

    private GoogleApiClient locationClient;
    private LocationRequest locationRequest;

    /**
     * @param deviceName The device name given by the user.
     * @param sensorManager The sensor manager obtained from the system services.
     * @param sensors A map between the sensor type and the user given sensor number.
     */
    public ListenerManager(String deviceName, Context context, SensorManager sensorManager, Map<Integer, Integer> sensors) {
        this.sensorManager = sensorManager;
        this.deviceName = deviceName;
        this.sensorListeners = new ArrayList<SimpleSensorListener>(sensors.size());
        this.valuators = new ArrayList<ScalarValuator>(sensors.size() + 3);
        this.valuators.add(new DateValuator());
        this.locationClient = new GoogleApiClient.Builder(context)
                .addApi(LocationServices.API).addConnectionCallbacks(this)
                .addOnConnectionFailedListener(this).build();
        locationRequest = new LocationRequest();
        locationRequest.setInterval(1000);
        locationRequest.setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
        locationRequest.setFastestInterval(500);
        locationRequest.setSmallestDisplacement(2);
        this.locationClient.connect();
        this.createLocationListener();
        this.createSensorListeners(sensors);
    }

    /**
     * Creates and attaches the sensor listeners. In the same time, this method builds the header line.
     * @param sensors A map between the sensor type and the user given sensor number.
     */
    private void createSensorListeners(Map<Integer, Integer> sensors) {
        StringBuilder builder = new StringBuilder("sep=;\ndevice;date;latitude;longitude");

        for (Map.Entry<Integer, Integer> entry : sensors.entrySet()) {
            builder.append(";");
            builder.append(entry.getValue());

            Sensor sensor = this.sensorManager.getDefaultSensor(entry.getKey());
            SimpleSensorListener listener = new SimpleSensorListener(entry.getValue());
            this.sensorManager.registerListener(listener, sensor, SensorManager.SENSOR_DELAY_NORMAL);
            this.valuators.add(listener.getValue());
            this.sensorListeners.add(listener);
        }

        this.headerLine = builder.toString();
    }

    /**
     * Builds and attaches the location listener.
     */
    private void createLocationListener() {
        locationListener = new SimpleLocationListener();
        this.valuators.add(locationListener.getLatitude());
        this.valuators.add(locationListener.getLongitude());
    }

    /**
     * Unregisters the listeners.
     */
    public void onDestroy() {
        try {
        } catch (SecurityException ex) {
            Log.e(TAG, "Permission not granted!", ex);
        }
        for (SimpleSensorListener listener : this.sensorListeners) {
            this.sensorManager.unregisterListener(listener);
        }
    }

    /**
     * Retrieves the header of the import-ready CSV file.
     * @return The header line.
     */
    public String getHeaderLine() {
        return this.headerLine;
    }

    /**
     * Gets the next line of the CSV file. This line is obtained from the most recent values
     * obtained by the sensors and from the location service.
     * @return The next line in the CSV file.
     */
    public String getNextLine() {
        StringBuilder builder = new StringBuilder(this.deviceName);
        for (ScalarValuator valuator : valuators) {
            builder.append(';');
            builder.append(valuator.getValueAsString());
        }
        return builder.toString();
    }

    /**
     * Gets a JSON representation of the current state of the device.
     * @return The JSON string. This can be directly used with the POST service.
     */
    public String getJSON() {
        try {
            JSONObject result = new JSONObject();
            result.put("device", this.deviceName);

            JSONObject position = new JSONObject();
            position.put("latitude", this.valuators.get(1).getValueAsDouble());
            position.put("longitude", this.valuators.get(2).getValueAsDouble());
            result.put("position", position);

            JSONArray values = new JSONArray();
            for (int i = 3; i < this.valuators.size(); ++i) {
                JSONObject value = new JSONObject();
                value.put("sensor", this.valuators.get(i).getValueAsLong());
                value.put("value", this.valuators.get(i).getValueAsDouble());
                values.put(value);
            }
            result.put("values", values);
            return result.toString();
        }
        catch(JSONException e) {
            Log.e(TAG, "JSON exception!", e);
            return "";
        }
    }

    @Override
    public void onConnected(@Nullable Bundle bundle) {
        try {
            Location location = LocationServices.FusedLocationApi.getLastLocation(this.locationClient);
            this.locationListener.onLocationChanged(location);
            LocationServices.FusedLocationApi.requestLocationUpdates(
                    locationClient, locationRequest, locationListener);
        }
        catch(SecurityException e) {

        }
    }

    @Override
    public void onConnectionSuspended(int i) {

    }

    @Override
    public void onConnectionFailed(@NonNull ConnectionResult connectionResult) {

    }

    /**
     * A simple valuator for obtaining the current date.
     * The string date values obtained from this class are in ISO format.
     */
    private static class DateValuator implements ScalarValuator{
        private DateFormat isoFormat;

        public DateValuator() {
            isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
        }

        @Override
        public String getValueAsString() {
            return isoFormat.format(new Date());
        }

        @Override
        public long getValueAsLong() {
            return new Date().getTime();
        }

        @Override
        public double getValueAsDouble() {
            return new Date().getTime();
        }


    }
}
