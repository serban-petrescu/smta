package diploma.android.client;

/**
 * A basic interface for wrapping a value provider.
 */
public interface ScalarValuator {

    /**
     * @return The current value in string format.
     */
    String getValueAsString();

    /**
     * @return The current value in long number format (if applicable).
     */
    long getValueAsLong();

    /**
     * @return The current value in double number format (if applicable).
     */
    double getValueAsDouble();
}
