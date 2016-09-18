/*
 * HtmlParser.java
 *
 * THIS FILE HAS BEEN GENERATED AUTOMATICALLY. DO NOT EDIT!
 */

package diploma.services.mail.html;

import java.io.Reader;

import net.percederberg.grammatica.parser.ParserCreationException;
import net.percederberg.grammatica.parser.ProductionPattern;
import net.percederberg.grammatica.parser.ProductionPatternAlternative;
import net.percederberg.grammatica.parser.RecursiveDescentParser;
import net.percederberg.grammatica.parser.Tokenizer;

/**
 * A token stream parser.
 *
 * @author   Serban Petrescu
 */
class HtmlParser extends RecursiveDescentParser {

    /**
     * A generated production node identity constant.
     */
    private static final int SUBPRODUCTION_1 = 3001;

    /**
     * A generated production node identity constant.
     */
    private static final int SUBPRODUCTION_2 = 3002;

    /**
     * A generated production node identity constant.
     */
    private static final int SUBPRODUCTION_3 = 3003;

    /**
     * A generated production node identity constant.
     */
    private static final int SUBPRODUCTION_4 = 3004;

    /**
     * A generated production node identity constant.
     */
    private static final int SUBPRODUCTION_5 = 3005;

    /**
     * A generated production node identity constant.
     */
    private static final int SUBPRODUCTION_6 = 3006;

    /**
     * Creates a new parser with a default analyzer.
     *
     * @param in             the input stream to read from
     *
     * @throws ParserCreationException if the parser couldn't be
     *             initialized correctly
     */
    public HtmlParser(Reader in) throws ParserCreationException {
        super(in);
        createPatterns();
    }

    /**
     * Creates a new parser.
     *
     * @param in             the input stream to read from
     * @param analyzer       the analyzer to use while parsing
     *
     * @throws ParserCreationException if the parser couldn't be
     *             initialized correctly
     */
    public HtmlParser(Reader in, HtmlAnalyzer analyzer)
        throws ParserCreationException {

        super(in, analyzer);
        createPatterns();
    }

    /**
     * Creates a new tokenizer for this parser. Can be overridden by a
     * subclass to provide a custom implementation.
     *
     * @param in             the input stream to read from
     *
     * @return the tokenizer created
     *
     * @throws ParserCreationException if the tokenizer couldn't be
     *             initialized correctly
     */
    protected Tokenizer newTokenizer(Reader in)
        throws ParserCreationException {

        return new HtmlTokenizer(in);
    }

    /**
     * Initializes the parser by creating all the production patterns.
     *
     * @throws ParserCreationException if the parser couldn't be
     *             initialized correctly
     */
    private void createPatterns() throws ParserCreationException {
        ProductionPattern             pattern;
        ProductionPatternAlternative  alt;

        pattern = new ProductionPattern(HtmlConstants.EMAIL,
                                        "email");
        alt = new ProductionPatternAlternative();
        alt.addProduction(HtmlConstants.CONTENT, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(HtmlConstants.CONTENT,
                                        "content");
        alt = new ProductionPatternAlternative();
        alt.addProduction(SUBPRODUCTION_1, 1, -1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(HtmlConstants.PLAIN,
                                        "plain");
        alt = new ProductionPatternAlternative();
        alt.addProduction(SUBPRODUCTION_2, 1, -1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(HtmlConstants.INSTRUCTION,
                                        "instruction");
        alt = new ProductionPatternAlternative();
        alt.addProduction(SUBPRODUCTION_3, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(HtmlConstants.IF,
                                        "if");
        alt = new ProductionPatternAlternative();
        alt.addToken(HtmlConstants.IF_START, 1, 1);
        alt.addProduction(HtmlConstants.EXPRESSION, 1, 1);
        alt.addProduction(HtmlConstants.CONTENT, 1, 1);
        alt.addProduction(SUBPRODUCTION_4, 0, 1);
        alt.addToken(HtmlConstants.IF_END, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(HtmlConstants.FOR,
                                        "for");
        alt = new ProductionPatternAlternative();
        alt.addToken(HtmlConstants.FOR_START, 1, 1);
        alt.addToken(HtmlConstants.VARIABLE, 1, 1);
        alt.addProduction(HtmlConstants.CONTENT, 1, 1);
        alt.addToken(HtmlConstants.FOR_END, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(HtmlConstants.OUTPUT,
                                        "output");
        alt = new ProductionPatternAlternative();
        alt.addToken(HtmlConstants.PRINT, 1, 1);
        alt.addProduction(HtmlConstants.EXPRESSION, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(HtmlConstants.EXPRESSION,
                                        "expression");
        alt = new ProductionPatternAlternative();
        alt.addProduction(SUBPRODUCTION_5, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(HtmlConstants.CALL,
                                        "call");
        alt = new ProductionPatternAlternative();
        alt.addToken(HtmlConstants.CALL_START, 1, 1);
        alt.addToken(HtmlConstants.VARIABLE, 1, 1);
        alt.addProduction(SUBPRODUCTION_6, 0, -1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(SUBPRODUCTION_1,
                                        "Subproduction1");
        pattern.setSynthetic(true);
        alt = new ProductionPatternAlternative();
        alt.addProduction(HtmlConstants.PLAIN, 1, 1);
        pattern.addAlternative(alt);
        alt = new ProductionPatternAlternative();
        alt.addProduction(HtmlConstants.INSTRUCTION, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(SUBPRODUCTION_2,
                                        "Subproduction2");
        pattern.setSynthetic(true);
        alt = new ProductionPatternAlternative();
        alt.addToken(HtmlConstants.LITERAL, 1, 1);
        pattern.addAlternative(alt);
        alt = new ProductionPatternAlternative();
        alt.addToken(HtmlConstants.DOLLAR, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(SUBPRODUCTION_3,
                                        "Subproduction3");
        pattern.setSynthetic(true);
        alt = new ProductionPatternAlternative();
        alt.addProduction(HtmlConstants.IF, 1, 1);
        pattern.addAlternative(alt);
        alt = new ProductionPatternAlternative();
        alt.addProduction(HtmlConstants.FOR, 1, 1);
        pattern.addAlternative(alt);
        alt = new ProductionPatternAlternative();
        alt.addProduction(HtmlConstants.OUTPUT, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(SUBPRODUCTION_4,
                                        "Subproduction4");
        pattern.setSynthetic(true);
        alt = new ProductionPatternAlternative();
        alt.addToken(HtmlConstants.ELSE, 1, 1);
        alt.addProduction(HtmlConstants.CONTENT, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(SUBPRODUCTION_5,
                                        "Subproduction5");
        pattern.setSynthetic(true);
        alt = new ProductionPatternAlternative();
        alt.addToken(HtmlConstants.VARIABLE, 1, 1);
        pattern.addAlternative(alt);
        alt = new ProductionPatternAlternative();
        alt.addProduction(HtmlConstants.CALL, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);

        pattern = new ProductionPattern(SUBPRODUCTION_6,
                                        "Subproduction6");
        pattern.setSynthetic(true);
        alt = new ProductionPatternAlternative();
        alt.addToken(HtmlConstants.VARIABLE, 1, 1);
        pattern.addAlternative(alt);
        alt = new ProductionPatternAlternative();
        alt.addToken(HtmlConstants.PARSED_LITERAL, 1, 1);
        pattern.addAlternative(alt);
        addPattern(pattern);
    }
}
