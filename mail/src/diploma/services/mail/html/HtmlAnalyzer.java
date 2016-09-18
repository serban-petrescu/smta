/*
 * HtmlAnalyzer.java
 *
 * THIS FILE HAS BEEN GENERATED AUTOMATICALLY. DO NOT EDIT!
 */

package diploma.services.mail.html;

import net.percederberg.grammatica.parser.Analyzer;
import net.percederberg.grammatica.parser.Node;
import net.percederberg.grammatica.parser.ParseException;
import net.percederberg.grammatica.parser.Production;
import net.percederberg.grammatica.parser.Token;

/**
 * A class providing callback methods for the parser.
 *
 * @author   Serban Petrescu
 */
abstract class HtmlAnalyzer extends Analyzer {

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enter(Node node) throws ParseException {
        switch (node.getId()) {
        case HtmlConstants.DOLLAR:
            enterDollar((Token) node);
            break;
        case HtmlConstants.IF_START:
            enterIfStart((Token) node);
            break;
        case HtmlConstants.ELSE:
            enterElse((Token) node);
            break;
        case HtmlConstants.IF_END:
            enterIfEnd((Token) node);
            break;
        case HtmlConstants.FOR_START:
            enterForStart((Token) node);
            break;
        case HtmlConstants.FOR_END:
            enterForEnd((Token) node);
            break;
        case HtmlConstants.CALL_START:
            enterCallStart((Token) node);
            break;
        case HtmlConstants.PRINT:
            enterPrint((Token) node);
            break;
        case HtmlConstants.PARSED_LITERAL:
            enterParsedLiteral((Token) node);
            break;
        case HtmlConstants.VARIABLE:
            enterVariable((Token) node);
            break;
        case HtmlConstants.LITERAL:
            enterLiteral((Token) node);
            break;
        case HtmlConstants.EMAIL:
            enterEmail((Production) node);
            break;
        case HtmlConstants.CONTENT:
            enterContent((Production) node);
            break;
        case HtmlConstants.PLAIN:
            enterPlain((Production) node);
            break;
        case HtmlConstants.INSTRUCTION:
            enterInstruction((Production) node);
            break;
        case HtmlConstants.IF:
            enterIf((Production) node);
            break;
        case HtmlConstants.FOR:
            enterFor((Production) node);
            break;
        case HtmlConstants.OUTPUT:
            enterOutput((Production) node);
            break;
        case HtmlConstants.EXPRESSION:
            enterExpression((Production) node);
            break;
        case HtmlConstants.CALL:
            enterCall((Production) node);
            break;
        }
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exit(Node node) throws ParseException {
        switch (node.getId()) {
        case HtmlConstants.DOLLAR:
            return exitDollar((Token) node);
        case HtmlConstants.IF_START:
            return exitIfStart((Token) node);
        case HtmlConstants.ELSE:
            return exitElse((Token) node);
        case HtmlConstants.IF_END:
            return exitIfEnd((Token) node);
        case HtmlConstants.FOR_START:
            return exitForStart((Token) node);
        case HtmlConstants.FOR_END:
            return exitForEnd((Token) node);
        case HtmlConstants.CALL_START:
            return exitCallStart((Token) node);
        case HtmlConstants.PRINT:
            return exitPrint((Token) node);
        case HtmlConstants.PARSED_LITERAL:
            return exitParsedLiteral((Token) node);
        case HtmlConstants.VARIABLE:
            return exitVariable((Token) node);
        case HtmlConstants.LITERAL:
            return exitLiteral((Token) node);
        case HtmlConstants.EMAIL:
            return exitEmail((Production) node);
        case HtmlConstants.CONTENT:
            return exitContent((Production) node);
        case HtmlConstants.PLAIN:
            return exitPlain((Production) node);
        case HtmlConstants.INSTRUCTION:
            return exitInstruction((Production) node);
        case HtmlConstants.IF:
            return exitIf((Production) node);
        case HtmlConstants.FOR:
            return exitFor((Production) node);
        case HtmlConstants.OUTPUT:
            return exitOutput((Production) node);
        case HtmlConstants.EXPRESSION:
            return exitExpression((Production) node);
        case HtmlConstants.CALL:
            return exitCall((Production) node);
        }
        return node;
    }

    /**
     * Called when adding a child to a parse tree node.
     *
     * @param node           the parent node
     * @param child          the child node, or null
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void child(Production node, Node child)
        throws ParseException {

        switch (node.getId()) {
        case HtmlConstants.EMAIL:
            childEmail(node, child);
            break;
        case HtmlConstants.CONTENT:
            childContent(node, child);
            break;
        case HtmlConstants.PLAIN:
            childPlain(node, child);
            break;
        case HtmlConstants.INSTRUCTION:
            childInstruction(node, child);
            break;
        case HtmlConstants.IF:
            childIf(node, child);
            break;
        case HtmlConstants.FOR:
            childFor(node, child);
            break;
        case HtmlConstants.OUTPUT:
            childOutput(node, child);
            break;
        case HtmlConstants.EXPRESSION:
            childExpression(node, child);
            break;
        case HtmlConstants.CALL:
            childCall(node, child);
            break;
        }
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterDollar(Token node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitDollar(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterIfStart(Token node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitIfStart(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterElse(Token node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitElse(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterIfEnd(Token node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitIfEnd(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterForStart(Token node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitForStart(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterForEnd(Token node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitForEnd(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterCallStart(Token node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitCallStart(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterPrint(Token node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitPrint(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterParsedLiteral(Token node)
        throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitParsedLiteral(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterVariable(Token node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitVariable(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterLiteral(Token node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitLiteral(Token node) throws ParseException {
        return node;
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterEmail(Production node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitEmail(Production node) throws ParseException {
        return node;
    }

    /**
     * Called when adding a child to a parse tree node.
     *
     * @param node           the parent node
     * @param child          the child node, or null
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void childEmail(Production node, Node child)
        throws ParseException {

        node.addChild(child);
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterContent(Production node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitContent(Production node) throws ParseException {
        return node;
    }

    /**
     * Called when adding a child to a parse tree node.
     *
     * @param node           the parent node
     * @param child          the child node, or null
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void childContent(Production node, Node child)
        throws ParseException {

        node.addChild(child);
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterPlain(Production node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitPlain(Production node) throws ParseException {
        return node;
    }

    /**
     * Called when adding a child to a parse tree node.
     *
     * @param node           the parent node
     * @param child          the child node, or null
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void childPlain(Production node, Node child)
        throws ParseException {

        node.addChild(child);
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterInstruction(Production node)
        throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitInstruction(Production node)
        throws ParseException {

        return node;
    }

    /**
     * Called when adding a child to a parse tree node.
     *
     * @param node           the parent node
     * @param child          the child node, or null
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void childInstruction(Production node, Node child)
        throws ParseException {

        node.addChild(child);
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterIf(Production node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitIf(Production node) throws ParseException {
        return node;
    }

    /**
     * Called when adding a child to a parse tree node.
     *
     * @param node           the parent node
     * @param child          the child node, or null
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void childIf(Production node, Node child)
        throws ParseException {

        node.addChild(child);
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterFor(Production node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitFor(Production node) throws ParseException {
        return node;
    }

    /**
     * Called when adding a child to a parse tree node.
     *
     * @param node           the parent node
     * @param child          the child node, or null
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void childFor(Production node, Node child)
        throws ParseException {

        node.addChild(child);
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterOutput(Production node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitOutput(Production node) throws ParseException {
        return node;
    }

    /**
     * Called when adding a child to a parse tree node.
     *
     * @param node           the parent node
     * @param child          the child node, or null
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void childOutput(Production node, Node child)
        throws ParseException {

        node.addChild(child);
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterExpression(Production node)
        throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitExpression(Production node)
        throws ParseException {

        return node;
    }

    /**
     * Called when adding a child to a parse tree node.
     *
     * @param node           the parent node
     * @param child          the child node, or null
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void childExpression(Production node, Node child)
        throws ParseException {

        node.addChild(child);
    }

    /**
     * Called when entering a parse tree node.
     *
     * @param node           the node being entered
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void enterCall(Production node) throws ParseException {
    }

    /**
     * Called when exiting a parse tree node.
     *
     * @param node           the node being exited
     *
     * @return the node to add to the parse tree, or
     *         null if no parse tree should be created
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected Node exitCall(Production node) throws ParseException {
        return node;
    }

    /**
     * Called when adding a child to a parse tree node.
     *
     * @param node           the parent node
     * @param child          the child node, or null
     *
     * @throws ParseException if the node analysis discovered errors
     */
    protected void childCall(Production node, Node child)
        throws ParseException {

        node.addChild(child);
    }
}
