package diploma.android.client;

import java.io.DataOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * A specialized HTTP client which ensures communication with the HANA services.
 */
public class SimpleHttpClient {

    /**
     * The base URL for all HANA, cloud based services.
     */
	 //Change the URL to match the diploma package on the HANA MDC
    private static final String CLOUD_BASE_URL = "https://databaseuser.hana.ondemand.com/spet/diploma/";

    /**
     * The URL (relative to the base URL) of the ping service.
     */
    private static final String PING_SERVICE_URL = "public/public.xsjs";

    /**
     * The URL (relative to the base URL) of the data reporting (post) service.
     */
    private static final String POST_SERVICE_URL = "public/public.xsjs";

    /**
     * The URL (relative to the base URL) of the import service.
     */
    private static final String IMPORT_SERVICE_URL = "public/public.xsjs?import=true";

    /**
     * Executes a simple GET request of the "ping" service to test the internet connection.
     * @return A flag which indicates if the service is reachable.
     */
    public boolean ping() {
        try {
            URL url = new URL(CLOUD_BASE_URL + PING_SERVICE_URL);
            HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
            int statusCode = urlConnection.getResponseCode();
            urlConnection.disconnect();
            return statusCode == 204;
        }
        catch (Exception e) {
            return false;
        }
    }

    /**
     * Sends a POST HTTP request to the data reporting service (post service).
     * @param content The content (body) of the request.
     * @return A flag which indicates if the request was successful.
     */
    public boolean post(String content) {
        try {
            URL url = new URL(CLOUD_BASE_URL + POST_SERVICE_URL);
            HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();

            urlConnection.setRequestMethod("POST");
            urlConnection.setDoOutput(true);
            DataOutputStream dStream = new DataOutputStream(urlConnection.getOutputStream());
            dStream.writeBytes(content);
            dStream.flush();
            dStream.close();

            int statusCode = urlConnection.getResponseCode();
            urlConnection.disconnect();
            return statusCode == 204;
        }
        catch (Exception e) {
            return false;
        }
    }

    /**
     * Uploads a file to the data import service.
     * @param file An input stream to the CSV file.
     * @return A flag indicating if the import was successful.
     */
    public boolean upload(InputStream file) {
        try {
            URL url = new URL(CLOUD_BASE_URL + IMPORT_SERVICE_URL);
            HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection();
            urlConnection.setRequestMethod("POST");
            urlConnection.setDoOutput(true);

            OutputStream out = urlConnection.getOutputStream();
            byte[] data = new byte[1024];
            int count;
            while ((count = file.read(data)) > 0) {
                out.write(data, 0, count);
            }
            out.flush();
            out.close();

            int statusCode = urlConnection.getResponseCode();
            urlConnection.disconnect();
            return statusCode == 204;
        }
        catch (Exception e) {
            return false;
        }
    }



}
