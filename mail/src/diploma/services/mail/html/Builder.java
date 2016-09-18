package diploma.services.mail.html;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Map;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Can be used to build a HTML content from a template, a JSON payload and a map
 * of procedures. The HTML template is loaded and parsed only once, at
 * instantiation.
 * 
 * @author Serban Petrescu
 */
public class Builder {
	private Content content;

	/**
	 * Private constructor which parses and save the parse tree of a given
	 * template file.
	 * 
	 * @param template
	 *            An input stream to the template file.
	 */
	public Builder(InputStream template) {
		try {
			HtmlParser parser = new HtmlParser(new InputStreamReader(template), new Analyzer());
			content = (Content) parser.parse().getValue(0);
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	/**
	 * Builds the HTML content from the template, JSON payload and procedures. 
	 * @param payload The JSON payload.
	 * @param procedures A map with procedures.
	 * @return A string with the generated HTML content.
	 */
	public String makeContent(JsonNode payload, Map<String, Procedure> procedures) {
		return content.evaluate(new Context(payload), procedures);
	}
}
