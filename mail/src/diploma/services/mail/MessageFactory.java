package diploma.services.mail;

import java.util.HashMap;
import java.util.Map;

import javax.mail.Message;
import javax.mail.Session;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import diploma.services.mail.template.Template;

/**
 * Factory class for building (Mime)Messages from JSON payloads.
 * 
 * @author Serban Petrescu
 */
public enum MessageFactory {
	/**
	 * Singleton instance.
	 */
	INSTANCE;

	/**
	 * Map between template names and the corresponding builder classes.
	 */
	private Map<String, String> classes;

	/**
	 * Map between template names and the corresponding builder instances.
	 */
	private Map<String, Template> instances;

	/**
	 * Private constructor which loads the configurations in the Templates.json
	 * file.
	 */
	private MessageFactory() {
		classes = new HashMap<String, String>();
		instances = new HashMap<String, Template>();
		ObjectMapper mapper = new ObjectMapper();
		try {
			TemplateConfig[] configs = mapper.readValue(MessageFactory.class.getResourceAsStream("Templates.json"),
					TemplateConfig[].class);
			for (TemplateConfig config : configs) {
				classes.put(config.name, config.clazz);
			}
		} catch (Exception e) {
			classes.clear();
		}
	}

	/**
	 * Builds a new message from a given payload.
	 * 
	 * @param session
	 *            The email session.
	 * @param payload
	 *            The JSON payload.
	 * @return A message which can be directly used a an email.
	 */
	public Message build(Session session, JsonNode payload) {
		Template t = resolve(payload.path("template").textValue());
		return t.build(session, payload);
	}

	/**
	 * Retrieves the builder instance from a template name. First it checks to
	 * see if the builder has already been instantiated. If yes, it returns the
	 * already existing instance. If not, it creates and returns a new instance.
	 * 
	 * @param name
	 *            The name of the template.
	 * @return A builder instance.
	 */
	private Template resolve(String name) {
		if (instances.containsKey(name)) {
			return instances.get(name);
		} else if (classes.containsKey(name)) {
			try {
				Template t = (Template) Class.forName(classes.get(name)).newInstance();
				instances.put(name, t);
				return t;
			} catch (Exception e) {
				throw new RuntimeException("Class not found or not instantiable!");
			}
		} else {
			throw new RuntimeException("Template not found!");
		}
	}

	/**
	 * Helper POJO for storing a template configuration.
	 * 
	 * @author Serban Petrescu
	 */
	private static class TemplateConfig {
		public String name;
		@JsonProperty("class")
		public String clazz;
	}
}
