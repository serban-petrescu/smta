package diploma.services.util;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URL;

import javax.naming.Context;
import javax.naming.InitialContext;

import com.sap.core.connectivity.api.configuration.ConnectivityConfiguration;
import com.sap.core.connectivity.api.configuration.DestinationConfiguration;

/**
 * Utility class for loading a remote web resource.
 * @author Serban Petrescu
 */
public class WebLoader {
	
	/**
	 * The destination base URL.
	 */
	private String baseUrl;
	
	/**
	 * The proxy settings.
	 */
	private Proxy proxy;
	
	/**
	 * Builds a web loader for a destination.
	 * @param destination The cockpit destination name.
	 */
	public WebLoader(String destination) {
		try {
			String proxyHost = null;
			int proxyPort;
			
			Context ctx = new InitialContext();
			ConnectivityConfiguration configuration = (ConnectivityConfiguration) ctx
					.lookup("java:comp/env/connectivityConfiguration");

			DestinationConfiguration destConfiguration = configuration.getConfiguration(destination);
			if (destConfiguration != null) {
				baseUrl = destConfiguration.getProperty("URL");
			}
			proxyHost = System.getProperty("http.proxyHost");
			proxyPort = Integer.parseInt(System.getProperty("http.proxyPort"));

			proxy = new Proxy(Proxy.Type.HTTP, new InetSocketAddress(proxyHost, proxyPort));
		}
		catch(Exception e) {
			throw new RuntimeException(e);
		}
	}
	
	/**
	 * Loads a resource and returns the input stream.
	 * @param relativeUrl The relative url of the resource (relative to the destination base path).
	 * @return The input stream towards the resource.
	 */
	public InputStream load(String relativeUrl) {
		URL url;
		try {
			url = new URL(baseUrl + relativeUrl);
			HttpURLConnection urlConnection = (HttpURLConnection) url.openConnection(proxy);
			return urlConnection.getInputStream();
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
	
	/**
	 * Opens a connection to a resource.
	 * @param relativeUrl The relative url of the resource (relative to the destination base path).
	 * @return A http connection to the resource.
	 */
	public HttpURLConnection open(String relativeUrl) {
		URL url;
		try {
			url = new URL(baseUrl + relativeUrl);
			return (HttpURLConnection) url.openConnection(proxy);
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}
}
