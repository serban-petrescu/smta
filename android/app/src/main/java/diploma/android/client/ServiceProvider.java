package diploma.android.client;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorManager;
import android.os.IBinder;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayInputStream;
import java.io.FileNotFoundException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.Charset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

/**
 * Class responsible for handling the service requests from the HTML user interface.
 */
public class ServiceProvider extends WebViewClient {

    /**
     * The base path for all service requests.
     */
    private static final String BASE_API_PATH = "file:///service/";

    /**
     * The absolute path for the data service requests.
     */
    private static final String DATA_API_PATH = "file:///service/data/";

    /**
     * The absolute path for the start service requests.
     */
    private static final String START_API_PATH = "file:///service/start/";

    /**
     * The absolute path for the stop service requests.
     */
    private static final String STOP_API_PATH = "file:///service/stop/";

    /**
     * The absolute path for the file service requests.
     */
    private static final String FILE_API_PATH = "file:///service/file/";

    /**
     * The name of the default charset.
     */
    private static final String DEFAULT_CHARSET_NAME = "UTF-8";

    /**
     * The default charset used.
     */
    private static final Charset DEFAULT_CHARSET = Charset.forName(DEFAULT_CHARSET_NAME);

    /**
     * Flag which indicates if the data collection service was started.
     */
    private boolean started = false;

    /**
     * The context (reference to the Main activity).
     */
    private Context context;

    /**
     * The connection to the data collection service.
     */
    private Connection connection;

    /**
     * @param context The context (reference to the Main activity).
     */
    public ServiceProvider(Context context) {
        this.context = context;
    }

    /**
     * Called when the provider is destroyed (on app close). Notifies the service if it is started.
     */
    public void onDestroy() {
        if (connection != null) {
            connection.sendStopCommand();
            connection = null;
        }
        this.context = null;
    }

    @Override
    public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
        if (url.startsWith(BASE_API_PATH)) {

            try {
                return manageRequest(url);
            } catch (Exception e) {
                return errorResponse(e.getMessage());
            }
        }
        return super.shouldInterceptRequest(view, url);
    }

    /**
     * Handles a request to the given URL. The URL must begin with the service base path.
     * @param url The URL on which the request was made.
     * @return The response to the HTTP request.
     * @throws JSONException
     * @throws UnsupportedEncodingException
     * @throws FileNotFoundException
     */
    private WebResourceResponse manageRequest(String url) throws JSONException, UnsupportedEncodingException, FileNotFoundException {
        if (url.equals(DATA_API_PATH)) {
            return getModelData();
        }
        else if(url.startsWith(START_API_PATH)) {
            return startService(URLDecoder.decode(url.substring(START_API_PATH.length()), DEFAULT_CHARSET_NAME));
        }
        else if(url.equals(STOP_API_PATH)) {
            return stopService();
        }
        else if (url.startsWith(FILE_API_PATH)) {
            return manageFile(URLDecoder.decode(url.substring(FILE_API_PATH.length()), DEFAULT_CHARSET_NAME));
        }
        return errorResponse("Invalid request.");
    }

    /**
     * Handles a request to the file service.
     * @param query The remainder of the URL after the path of the file service.
     * @return The result of the request.
     * @throws FileNotFoundException
     */
    private synchronized WebResourceResponse manageFile(String query) throws FileNotFoundException {
        if (query.startsWith("delete/")) {
            String fileName = query.substring("delete/".length());
            context.deleteFile(fileName);
            return emptyResponse();
        }
        else if (query.startsWith("read/")) {
            String fileName = query.substring("read/".length());
            return new WebResourceResponse("text/csv", DEFAULT_CHARSET_NAME, context.openFileInput(fileName));
        }
        else if (query.startsWith("upload/")) {
            String fileName = query.substring("upload/".length());
            if (new SimpleHttpClient().upload(context.openFileInput(fileName))) {
                //context.deleteFile(fileName);
                return emptyResponse();
            }
            else {
                return errorResponse("HTTP request failed.");
            }
        }
        return errorResponse("Invalid request.");
    }

    /**
     * Stops the data collection service.
     * @return The result of the request.
     */
    private synchronized WebResourceResponse stopService() {
        if (this.connection != null) {
            connection.sendStopCommand();
            context.unbindService(this.connection);
        }
        return emptyResponse();
    }
    /**
     * Starts the data collection service and saves the user input in the Shared Preferences.
     * @param query The remainder of the URL after the path of the start service. Should contain
     *              a JSON representation of the user input.
     * @return The result of the request.
     */
    private synchronized WebResourceResponse startService(String query) throws JSONException {
        if (!started) {
            JSONObject input = new JSONObject(query);
            this.savePreferences(input);

            JSONArray sensors = input.getJSONArray("s");
            Map<Integer, Integer> sensorMap = new HashMap<Integer, Integer>();
            for (int i = 0; i < sensors.length(); ++i) {
                int type = sensors.getJSONObject(i).getInt("t");
                int number = sensors.getJSONObject(i).getInt("n");
                if (number >= 0) {
                    sensorMap.put(type, number);
                }
            }

            Intent intent = new Intent(context, DataCollectionService.class);
            this.connection = new Connection(input.getString("n"), input.getLong("i") * 1000,
                    input.getBoolean("h"), sensorMap);
            context.bindService(intent, this.connection, Context.BIND_AUTO_CREATE);
        }
        return emptyResponse();
    }

    /**
     * Saves the user input in the shared preferences.
     * @param input The user input in JSON format.
     * @throws JSONException
     */
    private void savePreferences(JSONObject input) throws JSONException {
        SharedPreferences preferences = context.getSharedPreferences("settings", 0);
        SharedPreferences.Editor editor = preferences.edit();
        editor.putString("device-name", input.getString("n"));
        editor.putInt("device-interval", input.getInt("i"));
        editor.putBoolean("internet-enabled", input.getBoolean("h"));
        JSONArray sensors = input.getJSONArray("s");
        for (int i = 0; i < sensors.length(); ++i) {
            int type = sensors.getJSONObject(i).getInt("t");
            int number = sensors.getJSONObject(i).getInt("n");
            if (number >= 0) {
                editor.putInt("sensor-" + type + "-number", number);
                editor.putBoolean("sensor-" + type + "-enabled", true);
            } else {
                editor.putBoolean("sensor-" + type + "-enabled", false);
            }
        }
        editor.apply();
    }

    /**
     * Reads the model data (available sensors, saved user input, list of local files).
     * @return The model data wrapped in a web response.
     * @throws JSONException
     */
    private WebResourceResponse getModelData() throws JSONException{
        JSONObject settings = new JSONObject();

        SharedPreferences preferences = context.getSharedPreferences("settings", 0);
        settings.put("sensors", getSensors(preferences));
        settings.put("internet", getInternet(preferences));
        settings.put("name", preferences.getString("device-name", ""));
        settings.put("interval", preferences.getInt("device-interval", 1));

        JSONObject result = new JSONObject();
        result.put("settings", settings);
        result.put("files", this.getLocalFiles());
        result.put("started", this.started);

        return jsonResponse(result.toString());
    }

    /**
     * Reads the local files saved by the application.
     * @return A JSON array containing the file list.
     * @throws JSONException
     */
    private JSONArray getLocalFiles() throws JSONException {
        JSONArray result = new JSONArray();
        String[] files = context.fileList();
        for (String fileName : files) {
            JSONObject file = new JSONObject();
            file.put("name", fileName);
            result.put(file);
        }
        return result;
    }

    /**
     * Checks if internet connection is available and reads the preferences to see if it should
     * be enabled.
     * @param preferences   The shared preference instance.
     * @return A JSON object with the requested information.
     * @throws JSONException
     */
    private JSONObject getInternet(SharedPreferences preferences) throws JSONException {
        JSONObject result = new JSONObject();
        boolean hasInternet =  new SimpleHttpClient().ping();
        if (hasInternet) {
            result.put("available", true);
            result.put("enabled", preferences.getBoolean("internet-enabled", false));
        }
        else {
            result.put("available", false);
            result.put("enabled", false);
        }
        return result;
    }

    /**
     * Reads the available sensor list and the corresponding preference settings.
     * @param preferences The shared preference instance.
     * @return A JSON array with all the available sensor types.
     * @throws JSONException
     */
    private JSONArray getSensors(SharedPreferences preferences) throws JSONException {
        JSONArray result = new JSONArray();
        JSONObject object;

        SensorManager sensorManager = (SensorManager) context.getSystemService(Context.SENSOR_SERVICE);
        List<Sensor> sensors = sensorManager.getSensorList(Sensor.TYPE_ALL);
        Set<Integer> types = new TreeSet<Integer>();
        for (Sensor sensor : sensors) {
            types.add(sensor.getType());
        }

        int i = 1;
        for (int type : types) {
            Sensor sensor = sensorManager.getDefaultSensor(type);
            if (sensor != null) {
                object = new JSONObject();
                object.put("name", sensor.getName());
                object.put("id", type);
                object.put("number", preferences.getInt("sensor-" + type + "-number", i++));
                object.put("enabled", preferences.getBoolean("sensor-" + type + "-enabled", true));
                result.put(object);
            }
        }

        return result;
    }

    /**
     * Helper class for managing the connection to the data collection service.
     */
    private class Connection implements ServiceConnection{
        private String deviceName;
        private long millis;
        private boolean useInternet;
        private Map<Integer, Integer> sensors;
        DataCollectionService.ServiceBinder binder;

        public Connection(String deviceName, long millis, boolean useInternet,
                          Map<Integer, Integer> sensors) {
            this.deviceName = deviceName;
            this.millis = millis;
            this.useInternet = useInternet;
            this.sensors = sensors;
        }

        /**
         * Sends a stop command to the service.
         */
        public void sendStopCommand() {
            if (binder != null) {
                binder.stop();
                started = false;
                binder = null;
            }
        }

        @Override
        public void onServiceConnected(ComponentName className, IBinder service) {
            started = true;
            binder = (DataCollectionService.ServiceBinder) service;
            binder.initialize(deviceName, millis, useInternet, sensors);
        }

        @Override
        public void onServiceDisconnected(ComponentName className) {
            binder = null;
            started = false;
        }

    }

    /**
     * Helper method for building an empty response.
     * @return An empty response.
     */
    private static WebResourceResponse emptyResponse() {
        return new WebResourceResponse("text/plain",DEFAULT_CHARSET_NAME,
                new ByteArrayInputStream(new byte[]{}));
    }

    /**
     * Helper method for building an error response.
     * @param error The error message.
     * @return An error response.
     */
    private static WebResourceResponse errorResponse(String error) {
        String message = "{\"error\": \"" + error.replace("\"", "\\\"") + "\"}";
        return new WebResourceResponse("application/json", DEFAULT_CHARSET_NAME,
                new ByteArrayInputStream(message.getBytes(DEFAULT_CHARSET)));
    }

    /**
     * Helper method for building a json response.
     * @param json The json content.
     * @return A json response.
     */
    private static WebResourceResponse jsonResponse(String json) {
        return new WebResourceResponse("application/json", DEFAULT_CHARSET_NAME,
                new ByteArrayInputStream(json.getBytes(DEFAULT_CHARSET)));
    }
}
