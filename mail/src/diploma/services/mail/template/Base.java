package diploma.services.mail.template;

import javax.mail.Message;
import javax.mail.Message.RecipientType;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.internet.InternetAddress;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Abstract base class for email message templates.
 * @author Serban Petrescu
 */
public abstract class Base implements Template {

	@Override
	public Message build(Session session, JsonNode payload) {
		Message base = empty(session);
		setFrom(base, payload);
		setTo(base, payload);
		setCc(base, payload);
		setBcc(base, payload);
		setSubject(base, payload);
		setContent(base, payload);
		return base;
	}
	
	/**
	 * Retrieves the charset property from the Json configuration.
	 * @param payload The Json configuration.
	 * @return The charset.
	 */
	protected String getCharset(JsonNode payload) {
		String charset = payload.path("charset").textValue();
		if (charset == null || charset.equals("")) {
			return "UTF-8";
		}
		else {
			return charset;
		}
	}
	
	/**
	 * Gets the Mime subtype from the Json configuration.
	 * @param payload The Json configuration.
	 * @return THe subtype.
	 */
	protected String getSubtype(JsonNode payload) {
		String subtype = payload.path("subtype").textValue();
		if (subtype == null || subtype.equals("")) {
			return "plain";
		}
		else {
			return subtype;
		}
	}
	
	/**
	 * Sets the source account (email address).
	 * @param msg The email message.
	 * @param payload The Json configuration.
	 */
	protected void setFrom(Message msg, JsonNode payload) {
		String from = payload.path("from").textValue();
		if (from == null) {
			throw new RuntimeException("Invalid source address.");
		}
		try {
			msg.setFrom(InternetAddress.parse(from)[0]);
		} catch (MessagingException e) {
			throw new RuntimeException(e);
		}
	}

	/**
	 * Sets the destination (to) accounts (email addresses).
	 * @param msg The email message.
	 * @param payload The Json configuration.
	 */
	protected void setTo(Message msg, JsonNode payload) {
		String to = payload.path("to").textValue();
		if (to == null) {
			throw new RuntimeException("Invalid destination address.");
		}
		try {
			msg.setRecipients(RecipientType.TO, InternetAddress.parse(to));
		} catch (MessagingException e) {
			throw new RuntimeException(e);
		}
	}

	/**
	 * Sets the destination (cc) accounts (email addresses).
	 * @param msg The email message.
	 * @param payload The Json configuration.
	 */
	protected void setCc(Message msg, JsonNode payload) {
		String cc = payload.path("cc").textValue();
		if (cc == null) {
			return;
		}
		try {
			msg.setRecipients(RecipientType.CC, InternetAddress.parse(cc));
		} catch (MessagingException e) {
			throw new RuntimeException(e);
		}
	}

	/**
	 * Sets the destination (bcc) accounts (email addresses).
	 * @param msg The email message.
	 * @param payload The Json configuration.
	 */
	protected void setBcc(Message msg, JsonNode payload) {
		String bcc = payload.path("bcc").textValue();
		if (bcc == null) {
			return;
		}
		try {
			msg.setRecipients(RecipientType.BCC, InternetAddress.parse(bcc));
		} catch (MessagingException e) {
			throw new RuntimeException(e);
		}
	}
	
	/**
	 * Sets the subject of the email.
	 * @param msg The email message.
	 * @param payload The Json configuration.
	 */
	protected void setSubject(Message msg, JsonNode payload) {
		String subj = payload.path("subject").textValue();
		if (subj == null) {
			subj = "";
		}
		try {
			msg.setSubject(subj);
		} catch (MessagingException e) {
			throw new RuntimeException(e);
		}
	}
	
	/**
	 * Sets the content of the message.
	 * @param msg The email message.
	 * @param payload The Json configuration.
	 */
	protected abstract void setContent(Message msg, JsonNode payload);
	
	/**
	 * Builds an empty message.
	 * @param session The email session.
	 * @return An empty message.
	 */
	protected abstract Message empty(Session session);

}
