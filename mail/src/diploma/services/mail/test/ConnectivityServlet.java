package diploma.services.mail.test;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import javax.annotation.Resource;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.sap.cloud.account.TenantContext;
import diploma.services.util.WebLoader;

/**
 * Servlet class making http calls to specified http destinations. Destinations
 * are used in the following example connectivity scenarios:<br>
 * - Connecting to an outbound Internet resource using HTTP destinations<br>
 * - Connecting to an on-premise backend using on premise HTTP destinations,<br>
 * where the destinations have no authentication.<br>
 */
public class ConnectivityServlet extends HttpServlet {
	@Resource
	private TenantContext tenantContext;

	private static final long serialVersionUID = 1L;
	private static final int COPY_CONTENT_BUFFER_SIZE = 1024;
	private static final Logger LOGGER = LoggerFactory.getLogger(ConnectivityServlet.class);

	/** {@inheritDoc} */
	@Override
	public void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

		try {
			// Copy content from the incoming response to the outgoing response
			InputStream instream = new WebLoader("GOOGLE").load("images/branding/googlelogo/1x/googlelogo_color_272x92dp.png");
			OutputStream outstream = response.getOutputStream();
			response.setContentType("image/png");
			copyStream(instream, outstream);
		} catch (Exception e) {
			// Connectivity operation failed
			String errorMessage = "Connectivity operation failed with reason: " + e.getMessage() + ". See "
					+ "logs for details. Hint: Make sure to have an HTTP proxy configured in your "
					+ "local environment in case your environment uses " + "an HTTP proxy for the outbound Internet "
					+ "communication.";
			LOGGER.error("Connectivity operation failed", e);
			response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, errorMessage);
		}
	}

	private void copyStream(InputStream inStream, OutputStream outStream) throws IOException {
		byte[] buffer = new byte[COPY_CONTENT_BUFFER_SIZE];
		int len;
		while ((len = inStream.read(buffer)) != -1) {
			outStream.write(buffer, 0, len);
		}
	}
}