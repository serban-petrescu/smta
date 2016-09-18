package diploma.services.mail.html;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Stack;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Represents the evaluation context. The context is derived from a JSON payload
 * and can be afterwards only changed through loops (which actually change the
 * scope). Loops over object arrays which merge the content of the current
 * object with the outer scope, shadowing any already existing common
 * properties. Loops over string arrays will actually overshadow the array
 * itself, the current element being accessible through the array name inside
 * the loop.
 * 
 * @author Serban Petrescu
 */
class Context {

	/**
	 * A map between names and context nodes.
	 */
	private Map<String, Node> nodes;

	/**
	 * A map between names and flat values.
	 */
	private Map<String, Pair> flat;

	/**
	 * A stack of current loops.
	 */
	private Stack<Node> loops;

	/**
	 * Builds a context from a JSON payload. The JSON object can only consist
	 * of:
	 * <ul>
	 * <li>simple string properties</li>
	 * <li>string arrays</li>
	 * <li>object arrays (the objects may, as well, contain only these three
	 * types of fields)</li>
	 * <ul>
	 * 
	 * @param original
	 *            The JSON payload.
	 */
	public Context(JsonNode original) {
		nodes = Node.buildMap(original);
		flat = new HashMap<String, Pair>();
		loops = new Stack<Node>();
		flatten();
	}

	/**
	 * Gets the value of a field of the context.
	 * 
	 * @param key
	 *            The key / name of the field.
	 * @return The value of the field.
	 */
	public String get(String key) {
		if (flat.containsKey(key)) {
			return flat.get(key).value;
		} else {
			return "";
		}
	}

	/**
	 * Starts a loop of a given field.
	 * 
	 * @param key
	 *            The key / name of the field.
	 */
	public void loop(String key) {
		if (flat.containsKey(key)) {
			Node node = flat.get(key).node;
			node.iterate();
			loops.push(node);
		}
	}

	/**
	 * Goes to the next value of the current loop.
	 * 
	 * @return True if the loop indeed had a next value, false if it is over.
	 */
	public boolean next() {
		if (!loops.isEmpty()) {
			boolean result = loops.peek().next();
			flatten();
			if (!result) {
				loops.pop();
			}
			return result;
		} else {
			return false;
		}
	}

	/**
	 * Flattens the context by building the flat map.
	 */
	private void flatten() {
		ArrayList<Map<String, Node>> further = new ArrayList<Map<String, Node>>();
		further.add(nodes);
		flat.clear();
		for (int i = 0; i < further.size(); ++i) {
			Map<String, Node> current = further.get(i);
			for (Entry<String, Node> entry : current.entrySet()) {
				entry.getValue().merge(entry.getKey(), flat, further);
			}
		}
	}

	/**
	 * Helper POJO class for keeping a flat value and its origin node.
	 */
	private static class Pair {
		public Node node;
		public String value;

		public Pair(Node node, String value) {
			this.node = node;
			this.value = value;
		}
	}

	/**
	 * Helper class for representing context nodes.
	 */
	private static abstract class Node {
		/**
		 * Merges the current node with the partial flat representation of the
		 * context.
		 * 
		 * @param key
		 *            The key of the node within the context.
		 * @param context
		 *            The partial flattened context.
		 * @param further
		 *            A list to which any children which should be evaluated
		 *            further (after all siblings of this node are evaluated as
		 *            well) should be added.
		 */
		public abstract void merge(String key, Map<String, Pair> context, List<Map<String, Node>> further);

		/**
		 * Starts the iteration over the current node's values.
		 */
		public void iterate() { }

		/**
		 * Goes to the next value of the node during an iteration.
		 * @return Flase if there is no next value, true otherwise.
		 */
		public abstract boolean next();

		/**
		 * Builds a node from a Json representation.
		 * @param original The original JSON payload.
		 * @return A node of corresponding type.
		 */
		@SuppressWarnings("unchecked")
		public static Node buildNode(JsonNode original) {
			if (original.isTextual()) {
				return new TextNode(original.textValue());
			} else if (original.isArray()) {
				ArrayList<String> texts = new ArrayList<String>();
				ArrayList<Map<String, Node>> sub = new ArrayList<Map<String, Node>>();
				for (JsonNode inner : original) {
					if (inner.isTextual()) {
						texts.add(inner.textValue());
					} else {
						sub.add(buildMap(inner));
					}
				}
				if (sub.size() > 0) {
					return new ObjectArrayNode(sub.toArray(new HashMap[sub.size()]));
				} else {
					return new TextArrayNode(texts.toArray(new String[texts.size()]));
				}
			} else {
				return new TextNode("");
			}
		}

		/**
		 * Builds a map of nodes from a JSON payload.
		 * @param original The JSON paylod.
		 * @return A map between string keys (field names) and context nodes.
		 */
		public static Map<String, Node> buildMap(JsonNode original) {
			HashMap<String, Node> map = new HashMap<String, Node>();
			Iterator<Entry<String, JsonNode>> fields = original.fields();
			while (fields.hasNext()) {
				Entry<String, JsonNode> field = fields.next();
				map.put(field.getKey(), buildNode(field.getValue()));
			}
			return map;
		}
	}

	/**
	 * A simple text node.
	 */
	private static class TextNode extends Node {
		public String text;

		public TextNode(String text) {
			this.text = text;
		}

		public void merge(String key, Map<String, Pair> context, List<Map<String, Node>> further) {
			context.put(key, new Pair(this, text));
		}

		public boolean next() {
			return false;
		}
	}

	/**
	 * An object array node.
	 */
	private static class ObjectArrayNode extends Node {
		public Map<String, Node>[] objects;
		public int index;

		public ObjectArrayNode(Map<String, Node>[] objects) {
			this.objects = objects;
			this.index = -1;
		}

		public void iterate() {
			index = -1;
		}

		public boolean next() {
			index++;
			if (index < objects.length) {
				return true;
			} else {
				index = -1;
				return false;
			}
		}

		public void merge(String key, Map<String, Pair> context, List<Map<String, Node>> further) {
			if (index >= 0 && index < objects.length) {
				further.add(objects[index]);
			}
			context.put(key, new Pair(this, ""));
		}

	}

	/**
	 * A string array node.
	 */
	private static class TextArrayNode extends Node {
		public String[] texts;
		public int index;

		public TextArrayNode(String[] texts) {
			this.texts = texts;
			this.index = -1;
		}

		public void iterate() {
			index = -1;
		}

		public void merge(String key, Map<String, Pair> context, List<Map<String, Node>> further) {
			if (index >= 0 && index < texts.length) {
				context.put(key, new Pair(this, texts[index]));
			} else {
				context.put(key, new Pair(this, ""));
			}
		}

		public boolean next() {
			index++;
			if (index < texts.length) {
				return true;
			} else {
				index = -1;
				return false;
			}
		}
	}

}
