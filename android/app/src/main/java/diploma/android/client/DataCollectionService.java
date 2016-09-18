package diploma.android.client;

import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.hardware.SensorManager;
import android.os.Binder;
import android.os.IBinder;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.Charset;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

/**
 * An Android service which, when run, periodically persists the values read by the sensors.
 */
public class DataCollectionService extends Service {

    /**
     * The manager responsible for creating, attaching and querying the sensor and location values.
     */
    private ListenerManager manager;

    /**
     * The strategy used to persist the values.
     */
    private PersistStrategy strategy;

    /**
     * The timer used to ensure the periodic persistence process.
     */
    private Timer timer;

    @Override
    public void onDestroy()
    {
        super.onDestroy();
        this.destroyDependents();
    }

    /**
     * Destroys all dependent objects (the timer, strategy and listener manager).
     */
    private void destroyDependents() {
        if (manager != null) {
            manager.onDestroy();
            manager = null;
        }
        if (strategy != null) {
            strategy.destroy();
            strategy = null;
        }
        if (timer != null) {
            timer.cancel();
            timer = null;
        }
    }

    /**
     * Binder class for the service.
     */
    public class ServiceBinder extends Binder{

        /**
         * Initializes the service.
         * @param deviceName    The device name given by the user.
         * @param millis        The milliseconds between consecutive persists.
         * @param useInternet   Flag indicating if the service should use the internet.
         * @param sensors       A map between enabled sensor types and user-given sensor numbers.
         */
        public void initialize(String deviceName, long millis, boolean useInternet,
                               Map<Integer, Integer> sensors) {
            destroyDependents();

            SensorManager sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
            manager = new ListenerManager(deviceName, DataCollectionService.this, sensorManager, sensors);

            if (useInternet) {
                strategy = new CombinedStrategy();
            }
            else {
                strategy = new LocalStrategy();
            }
            strategy.initialize();

            timer = new Timer();
            timer.scheduleAtFixedRate(strategy, millis, millis);
        }

        /**
         * Stops the service (by cancelling the timer and destroying the managers).
         */
        public void stop() {
            if (timer != null) {
                timer.cancel();
                destroyDependents();
            }
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return new ServiceBinder();
    }

    /**
     * Base class for persistence strategies.
     */
    private static abstract class PersistStrategy extends TimerTask {

        /**
         * Initializes the strategy.
         */
        public void initialize(){ }

        /**
         * Destroys the strategy.
         */
        public void destroy(){ }

        /**
         * Persists the current data.
         * @return Flag indicating if the operation was successful.
         */
        public abstract boolean persist();

        @Override
        public void run() {
            persist();
        }
    }

    /**
     * Strategy which saves all data in a local CSV file.
     */
    private class LocalStrategy extends  PersistStrategy {
        private String format;
        private FileOutputStream output;
        private int sequence;
        private int counter;

        @Override
        public void initialize() {
            DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US);
            format = dateFormat.format(new Date()) + "-%03d.csv";
            sequence = 0;
            createFile();
        }

        private void createFile() {
            try {
                counter = 0;
                sequence++;
                output = openFileOutput(String.format(format, sequence), Context.MODE_PRIVATE);
                output.write(manager.getHeaderLine().getBytes(Charset.forName("UTF-8")));
                output.write('\n');
            } catch (Exception e) {
                output = null;
            }
        }

        @Override
        public boolean persist() {
            if (output != null) {
                try {
                    output.write(manager.getNextLine().getBytes(Charset.forName("UTF-8")));
                    output.write('\n');
                    counter++;
                    if (counter >= 100) {
                        output.close();
                        createFile();
                    }
                    return true;
                } catch (Exception e) {
                    output = null;
                }
            }
            return false;
        }

        @Override
        public void destroy() {
            try {
                output.close();
                output = null;
            } catch (IOException e) {
                output = null;
            }
        }
    }

    /**
     * Strategy which immediately posts all data to the remote service.
     */
    private class InternetStrategy extends PersistStrategy {
        /**
         * A simple HTTP client used for doing the POST requests.
         */
        private SimpleHttpClient client;

        @Override
        public void initialize() {
            client = new SimpleHttpClient();
        }

        @Override
        public boolean persist() {
            return client.post(manager.getJSON());
        }
    }

    /**
     * A combined (composite) strategy, which attempts first to save the data on the remote
     * service and, if this fails, then falls back to saving the data locally.
     */
    private class CombinedStrategy extends  PersistStrategy {

        /**
         * An instance of the internet persistence strategy. For each persist call, first an attempt
         * to use this strategy is made.
         */
        private PersistStrategy internet;

        /**
         * An instance of the local persistence strategy. This is only instantiated when the first
         * failed attempt of the internet-based persistence strategy occurs.
         */
        private PersistStrategy local;

        @Override
        public void initialize() {
            internet = new InternetStrategy();
            internet.initialize();
        }

        @Override
        public boolean persist() {
            boolean success = internet.persist();
            if (!success) {
                if (local == null) {
                    local = new LocalStrategy();
                    local.initialize();
                }
                return local.persist();
            }
            return true;
        }

        @Override
        public void destroy() {
            internet.destroy();
            if (local != null) {
                local.destroy();
            }
        }
    }
}
