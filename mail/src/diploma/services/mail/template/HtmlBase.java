package diploma.services.mail.template;

import java.util.Map;

import javax.mail.BodyPart;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;

import com.fasterxml.jackson.databind.JsonNode;

import diploma.services.mail.html.Builder;
import diploma.services.mail.html.Procedure;

/**
 * Represents a HTML-template based email template. The body is built by
 * interpreting a given HTML template with a context built out of the JSon
 * payload.
 * 
 * @author Serban Petrescu
 */
public abstract class HtmlBase extends Base {
	/**
	 * The HTML template builder.
	 */
	protected Builder builder;

	/**
	 * Initializes the email template class (instantiates the builder).
	 * 
	 * @param path
	 */
	protected void initialize(String path) {
		builder = new Builder(HtmlBase.class.getResourceAsStream(path));
	}

	/**
	 * Creates the procedure map. This is called once for each email message
	 * constructed (of course, some procedures can be reused).
	 * 
	 * @param msg The email message itself.
	 * @param multi The multipart body of the message.
	 * @return A map between procedure names and objects.
	 */
	protected abstract Map<String, Procedure> createProcedures(Message msg, MimeMultipart multi);

	@Override
	protected void setContent(Message msg, JsonNode payload) {
		MimeMultipart multiPart = new MimeMultipart("related");
		try {
			BodyPart part = new MimeBodyPart();
			part.setContent(builder.makeContent(payload, createProcedures(msg, multiPart)), "text/html");
			multiPart.addBodyPart(part, 0);
			msg.setContent(multiPart);
		} catch (MessagingException e) {
			throw new RuntimeException(e);
		}

	}

	@Override
	protected Message empty(Session session) {
		return new MimeMessage(session);
	}

}
