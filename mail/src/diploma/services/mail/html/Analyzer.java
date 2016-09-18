package diploma.services.mail.html;

import java.util.ArrayList;
import java.util.List;

import net.percederberg.grammatica.parser.Node;
import net.percederberg.grammatica.parser.ParseException;
import net.percederberg.grammatica.parser.Production;
import net.percederberg.grammatica.parser.Token;

/**
 * A class providing callback methods for the parser.
 *
 * @author Serban Petrescu
 */
class Analyzer extends HtmlAnalyzer {

	/**
	 * Removes the dollar sign and white spaces from variable names.
	 * 
	 * @param name
	 *            The given variable name.
	 * @return A trimmed version of the name.
	 */
	private static String removeDollar(String name) {
		name = name.trim();
		if (name.length() < 1) {
			return "";
		} else {
			return name.substring(1);
		}
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitDollar(Token node) throws ParseException {
		node.addValue(new Content.Literal("$"));
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitVariable(Token node) throws ParseException {
		String name = removeDollar(node.getImage());
		node.addValue(new Content.Variable(name));
		node.addValue(name);
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitParsedLiteral(Token node) throws ParseException {
		String quoted = removeDollar(node.getImage());
		if (quoted.length() < 2) {
			node.addValue(new Content.Literal(""));
		} else {
			node.addValue(new Content.Literal(quoted.substring(1, quoted.length() - 1)));
		}
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitLiteral(Token node) throws ParseException {
		node.addValue(new Content.Literal(node.getImage()));
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitEmail(Production node) throws ParseException {
		node.addValue(node.getChildAt(0).getValue(0));
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitContent(Production node) throws ParseException {
		List<Content> list = new ArrayList<Content>();
		for (int i = 0; i < node.getChildCount(); ++i) {
			list.add((Content) node.getChildAt(i).getValue(0));
		}
		node.addValue(new Content.Composite(list));
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitPlain(Production node) throws ParseException {
		List<Content> list = new ArrayList<Content>();
		for (int i = 0; i < node.getChildCount(); ++i) {
			list.add((Content) node.getChildAt(i).getValue(0));
		}
		node.addValue(new Content.Composite(list));
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitInstruction(Production node) throws ParseException {
		node.addValue(node.getChildAt(0).getValue(0));
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitIf(Production node) throws ParseException {
		if (node.getChildCount() == 6) {
			node.addValue(new Content.IfThenElse((Content) node.getChildAt(1).getValue(0),
					(Content) node.getChildAt(2).getValue(0), (Content) node.getChildAt(4).getValue(0)));
		} else {
			node.addValue(new Content.IfThenElse((Content) node.getChildAt(1).getValue(0),
					(Content) node.getChildAt(2).getValue(0)));
		}
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitFor(Production node) throws ParseException {
		node.addValue(
				new Content.ForLoop((String) node.getChildAt(1).getValue(1), (Content) node.getChildAt(2).getValue(0)));
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitOutput(Production node) throws ParseException {
		node.addValue(node.getChildAt(1).getValue(0));
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitExpression(Production node) throws ParseException {
		node.addValue(node.getChildAt(0).getValue(0));
		return node;
	}

	/**
	 * Called when exiting a parse tree node.
	 *
	 * @param node
	 *            the node being exited
	 *
	 * @return the node to add to the parse tree, or null if no parse tree
	 *         should be created
	 *
	 * @throws ParseException
	 *             if the node analysis discovered errors
	 */
	@Override
	protected Node exitCall(Production node) throws ParseException {
		String name = (String) node.getChildAt(1).getValue(1);
		List<Content> params = new ArrayList<Content>();
		for (int i = 2; i < node.getChildCount(); ++i) {
			params.add((Content) node.getChildAt(i).getValue(0));
		}
		node.addValue(new Content.Call(name, params));
		return node;
	}
}
