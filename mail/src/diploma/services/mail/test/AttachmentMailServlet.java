package diploma.services.mail.test;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.activation.DataHandler;
import javax.activation.DataSource;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMultipart;
import javax.mail.util.ByteArrayDataSource;
import javax.naming.InitialContext;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import diploma.services.mail.html.Procedure;
import diploma.services.mail.template.HtmlBase;
import diploma.services.mail.template.Template;
import diploma.services.util.WebLoader;

public class AttachmentMailServlet extends HttpServlet {

	private static final long serialVersionUID = 1L;
	private static final Logger LOGGER = LoggerFactory.getLogger(AttachmentMailServlet.class);

	/** {@inheritDoc} */
	@Override
	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		Transport transport = null;
		try {
			ObjectMapper mapper = new ObjectMapper();
			InitialContext ctx = new InitialContext();
			Session mailSession = (Session) ctx.lookup("java:comp/env/mail/MAIL_DIPLOMA_GMAIL");

			JsonNode tree = mapper.readTree(HtmlTemplate.class.getResourceAsStream("HtmlTemplateContext.json"));
			
			Template template = new HtmlTemplate();
			Message msg = template.build(mailSession, tree);
			
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

	private static class HtmlTemplate extends HtmlBase {

		public HtmlTemplate() {
			initialize("/diploma/services/mail/test/HtmlTemplateFile.html");
		}

		@Override
		protected Map<String, Procedure> createProcedures(Message msg, MimeMultipart multi) {
			Map<String, Procedure> map = new HashMap<String, Procedure>();
			map.put("upper", new Procedure() {
				@Override
				public String evaluate(List<String> parameters) {
					if (parameters.size() == 1) {
						return parameters.get(0).toUpperCase();
					} else {
						return "";
					}
				}
			});
			map.put("image", new ImageProcedure("GOOGLE", "images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
					multi, "image"));
			return map;
		}

	}

	private static class ImageProcedure implements Procedure {

		private WebLoader loader;
		private String path;
		private String cid;
		private MimeMultipart multi;

		public ImageProcedure(String dest, String path, MimeMultipart multi, String cid) {
			loader = new WebLoader(dest);
			this.path = path;
			this.multi = multi;
			this.cid = cid;
		}

		@Override
		public String evaluate(List<String> parameters) {
			try {
				MimeBodyPart part = new MimeBodyPart();
				part.setHeader("Content-ID", "<" + cid + ">");
				InputStream stream = loader.load(path);
				DataSource imageSource = new ByteArrayDataSource(stream, "image/png");
				part.setDataHandler(new DataHandler(imageSource));
				multi.addBodyPart(part);
				return "<img src=\"cid:" + cid + "\" />";
			} catch (Exception e) {
				return "<p>Unable to load image</p>";
			}
		}

	}

}
