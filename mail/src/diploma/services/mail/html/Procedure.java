package diploma.services.mail.html;

import java.util.List;

/**
 * Interface for the procedures which can be called during template
 * instantiation.
 * 
 * @author Serban Petrescu
 */
public interface Procedure {
	/**
	 * Evaluates the procedure.
	 * @param parameters An optional list of string parameters.
	 * @return The evaluation result.
	 */
	String evaluate(List<String> parameters);
}
