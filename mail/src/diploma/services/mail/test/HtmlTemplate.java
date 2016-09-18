package diploma.services.mail.test;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import diploma.services.mail.html.Builder;
import diploma.services.mail.html.Procedure;

public class HtmlTemplate {
	public static void main(String[] args) throws JsonProcessingException, IOException{
		Map<String, Procedure> procedures = new HashMap<String, Procedure>();
		Builder builder = new Builder(HtmlTemplate.class.getResourceAsStream("HtmlTemplateFile.html"));
		procedures.put("upper", new Procedure() {
			@Override
			public String evaluate(List<String> parameters) {
				if (parameters.size() == 1) {
					return parameters.get(0).toUpperCase();
				}
				else {
					return "";
				}
			}
		});
		ObjectMapper mapper = new ObjectMapper();
		JsonNode tree = mapper.readTree(HtmlTemplate.class.getResourceAsStream("HtmlTemplateContext.json"));
		System.out.println(builder.makeContent(tree, procedures));
	}
}
