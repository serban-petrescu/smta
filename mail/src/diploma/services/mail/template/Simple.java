package diploma.services.mail.template;

import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Represents a simple text based email message. The body of the message is
 * taken directly from the Json payload.
 * 
 * @author Serban Petrescu
 */
public class Simple extends Base {

	@Override
	protected void setContent(Message msg, JsonNode payload) {
		MimeMultipart multiPart = new MimeMultipart("alternative");
		MimeBodyPart part = new MimeBodyPart();
		try {
			part.setText(payload.path("body").textValue(), getCharset(payload), getSubtype(payload));
			multiPart.addBodyPart(part);
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
