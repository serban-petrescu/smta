package diploma.services.mail;

import java.io.IOException;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.naming.InitialContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Main service servlet. Handles a GET request which returns a JSON output of
 * available accounts and a POST request which can be used to send emails by
 * specifying a JSON body with the desired configuration.
 * 
 * @author Serban Petrescu
 */
public class MailServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;
	private static final Logger LOGGER = LoggerFactory.getLogger(MailServlet.class);

	/** {@inheritDoc} */
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		response.setHeader("Content-Type", "application/json");
		ObjectMapper mapper = new ObjectMapper();
		mapper.writeValue(response.getWriter(), Configuration.INSTANCE.getProviderAccounts());
	}

	/** {@inheritDoc} */
	@Override
	protected void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		Transport transport = null;
		try {
			ObjectMapper mapper = new ObjectMapper();
			JsonNode payload = mapper.readTree(request.getInputStream());

			String destination = Configuration.INSTANCE.getDestinationForAddress(payload.path("from").textValue());
			if (destination == null) {
				throw new RuntimeException("Unknown email address.");
			}
			InitialContext ctx = new InitialContext();
			Session mailSession = (Session) ctx.lookup("java:comp/env/mail/" + destination);

			Message msg = MessageFactory.INSTANCE.build(mailSession, payload);

			transport = mailSession.getTransport();
			transport.connect();
			transport.sendMessage(msg, msg.getAllRecipients());

			response.setStatus(204);
		} catch (Exception e) {
			LOGGER.error("Mail operation failed", e);
			throw new ServletException(e);
		} finally {
			if (transport != null) {
				try {
					transport.close();
				} catch (MessagingException e) {
					throw new ServletException(e);
				}
			}
		}
	}

}
