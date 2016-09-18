package diploma.services.mail.html;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Represents an abstract node of the parsed HTML template tree.
 * 
 * @author Serban Petrescu
 */
abstract class Content {

	/**
	 * Evaluates and retrieves the node's contents with the given context and
	 * procedure map.
	 * 
	 * @param context
	 *            The context of the evaluation.
	 * @param procedures
	 *            The available procedures.
	 * @return A string representing the evaluation results.
	 */
	public abstract String evaluate(Context context, Map<String, Procedure> procedures);

	/**
	 * Represents a node which contains only static content.
	 */
	static class Literal extends Content {
		private String text;

		public Literal(String text) {
			this.text = text;
		}

		public String evaluate(Context context, Map<String, Procedure> procedures) {
			return text;
		}
	}

	/**
	 * Represents a node which contains only a number of sub-nodes. The contents
	 * of the sub-nodes are concatenated to obtain the content of this node.
	 */
	static class Composite extends Content {
		private List<Content> list;

		public Composite(List<Content> list) {
			this.list = list;
		}

		public String evaluate(Context context, Map<String, Procedure> procedures) {
			StringBuilder str = new StringBuilder("");
			for (Content item : list) {
				str.append(item.evaluate(context, procedures));
			}
			return str.toString();
		}
	}

	/**
	 * Represents a for loop node. The for loop goes over a variable (which can
	 * either be a string list or an object list) and re-evaluates the content
	 * of the loop using the updated context.
	 */
	static class ForLoop extends Content {
		private String name;
		private Content inner;

		public ForLoop(String name, Content inner) {
			this.name = name;
			this.inner = inner;
		}

		public String evaluate(Context context, Map<String, Procedure> procedures) {
			StringBuilder str = new StringBuilder("");
			context.loop(name);
			while (context.next()) {
				str.append(inner.evaluate(context, procedures));
			}
			return str.toString();
		}
	}

	/**
	 * Represents an if-then-else statement. It has a check (expression) content
	 * which is evaluated. If the result is an empty string (falsy), then the
	 * "else branch" content is evaluated and returned (or an empty string if
	 * there is no else clause). If the result is a non-empty string, then the
	 * content from the "then branch" is evaluated and returned.
	 */
	static class IfThenElse extends Content {
		private Content check, first, second;

		public IfThenElse(Content check, Content first) {
			this.check = check;
			this.first = first;
			this.second = new Literal("");
		}

		public IfThenElse(Content check, Content first, Content second) {
			this.check = check;
			this.first = first;
			this.second = second;
		}

		public String evaluate(Context context, Map<String, Procedure> procedures) {
			String result = check.evaluate(context, procedures);
			if (!result.isEmpty()) {
				return first.evaluate(context, procedures);
			} else {
				return second.evaluate(context, procedures);
			}
		}
	}

	/**
	 * A node which represents a variable value retrieval.
	 */
	static class Variable extends Content {
		private String name;

		public Variable(String name) {
			this.name = name;
		}

		public String evaluate(Context context, Map<String, Procedure> procedures) {
			return context.get(name);
		}
	}

	/**
	 * A node which represents a call to a procedure. The procedure name is
	 * first searched in the procedure map. If it is not found, an empty string
	 * is returned. If it is indeed found, the parameters are first evaluated to
	 * obtain a list of strings and then passed on to the procedure call as
	 * arguments.
	 */
	static class Call extends Content {
		private String name;
		private List<Content> parameters;

		public Call(String name, List<Content> parameters) {
			this.name = name;
			this.parameters = parameters;
		}

		public String evaluate(Context context, Map<String, Procedure> procedures) {
			if (procedures.containsKey(name)) {
				List<String> values = new ArrayList<String>();
				for (Content param : this.parameters) {
					values.add(param.evaluate(context, procedures));
				}
				return procedures.get(name).evaluate(values);
			} else {
				return "";
			}
		}

	}
}
