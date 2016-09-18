package diploma.services.mail.template;

import javax.mail.Message;
import javax.mail.Session;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Minimalist interface for an email message template.
 * @author Serban Petrescu
 */
public interface Template {
	Message build(Session session, JsonNode payload);
}
