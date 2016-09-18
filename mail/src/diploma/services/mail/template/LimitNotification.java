package diploma.services.mail.template;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.activation.DataHandler;
import javax.activation.DataSource;
import javax.mail.Message;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMultipart;
import javax.mail.util.ByteArrayDataSource;

import diploma.services.mail.html.Procedure;
import diploma.services.util.WebLoader;

/**
 * Template for email messages used for notifying users about limit violations.
 * 
 * @author Serban Petrescu
 */
public class LimitNotification extends HtmlBase {

	public LimitNotification() {
		initialize("/diploma/services/mail/template/LimitNotification.html");
	}

	@Override
	protected Map<String, Procedure> createProcedures(Message msg, MimeMultipart multi) {
		Map<String, Procedure> map = new HashMap<String, Procedure>();
		map.put("image", new ImageProcedure(multi));
		map.put("format", new FormatProcedure());
		return map;
	}

	/**
	 * Procedure for formatting a string using {@link String.format}. The first
	 * parameter is the format string, the rest of the parameters are passed as
	 * formatting parameters.
	 */
	private static class FormatProcedure implements Procedure {

		@Override
		public String evaluate(List<String> parameters) {
			if (parameters.size() < 1) {
				return "";
			}
			String format = parameters.get(0);
			if (parameters.size() > 1) {
				String[] args = new String[parameters.size() - 1];
				for (int i = 1; i < parameters.size(); ++i) {
					args[i - 1] = parameters.get(i);
				}
				return String.format(format, (Object[]) args);
			} else {
				return format;
			}
		}

	}

	/**
	 * Procedure for loading an image from a remote site and adding it as an
	 * attachment and img tag. The procedure accepts at least two parameters.
	 * The first is the cockpit destination for the remote website. The second
	 * is either directly the path or a format string filled with the rest of
	 * the parameters.
	 */
	private static class ImageProcedure implements Procedure {

		private MimeMultipart multi;
		private int imageCount;

		public ImageProcedure(MimeMultipart multi) {
			this.multi = multi;
			this.imageCount = 0;
		}

		@Override
		public String evaluate(List<String> parameters) {
			this.imageCount++;
			try {
				if (parameters.size() < 2) {
					return "<p>Insufficient parameters</p>";
				}
				String path = parameters.get(1);
				if (parameters.size() > 2) {
					String[] args = new String[parameters.size() - 2];
					for (int i = 2; i < parameters.size(); ++i) {
						args[i - 2] = parameters.get(i);
					}
					path = String.format(path, (Object[]) args);
				}
				HttpURLConnection conn = new WebLoader(parameters.get(0)).open(path);
				String cid = "image" + this.imageCount;
				MimeBodyPart part = new MimeBodyPart();
				part.setHeader("Content-ID", "<" + cid + ">");
				InputStream stream = conn.getInputStream();
				DataSource imageSource = new ByteArrayDataSource(stream, conn.getContentType());
				part.setDataHandler(new DataHandler(imageSource));
				multi.addBodyPart(part);
				return "<img src=\"cid:" + cid + "\" />";
			} catch (Exception e) {
				return "<p>Unable to load image</p>";
			}
		}

	}
}
