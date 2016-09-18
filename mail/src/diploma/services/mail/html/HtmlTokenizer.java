/*
 * HtmlTokenizer.java
 *
 * THIS FILE HAS BEEN GENERATED AUTOMATICALLY. DO NOT EDIT!
 */

package diploma.services.mail.html;

import java.io.Reader;

import net.percederberg.grammatica.parser.ParserCreationException;
import net.percederberg.grammatica.parser.TokenPattern;
import net.percederberg.grammatica.parser.Tokenizer;

/**
 * A character stream tokenizer.
 *
 * @author   Serban Petrescu
 */
class HtmlTokenizer extends Tokenizer {

    /**
     * Creates a new tokenizer for the specified input stream.
     *
     * @param input          the input stream to read
     *
     * @throws ParserCreationException if the tokenizer couldn't be
     *             initialized correctly
     */
    public HtmlTokenizer(Reader input) throws ParserCreationException {
        super(input, false);
        createPatterns();
    }

    /**
     * Initializes the tokenizer by creating all the token patterns.
     *
     * @throws ParserCreationException if the tokenizer couldn't be
     *             initialized correctly
     */
    private void createPatterns() throws ParserCreationException {
        TokenPattern  pattern;

        pattern = new TokenPattern(HtmlConstants.DOLLAR,
                                   "DOLLAR",
                                   TokenPattern.STRING_TYPE,
                                   "$$");
        addPattern(pattern);

        pattern = new TokenPattern(HtmlConstants.IF_START,
                                   "IF_START",
                                   TokenPattern.REGEXP_TYPE,
                                   "\\$if\\s+");
        addPattern(pattern);

        pattern = new TokenPattern(HtmlConstants.ELSE,
                                   "ELSE",
                                   TokenPattern.REGEXP_TYPE,
                                   "\\$else\\s+");
        addPattern(pattern);

        pattern = new TokenPattern(HtmlConstants.IF_END,
                                   "IF_END",
                                   TokenPattern.REGEXP_TYPE,
                                   "\\$endif\\s+");
        addPattern(pattern);

        pattern = new TokenPattern(HtmlConstants.FOR_START,
                                   "FOR_START",
                                   TokenPattern.REGEXP_TYPE,
                                   "\\$for\\s+");
        addPattern(pattern);

        pattern = new TokenPattern(HtmlConstants.FOR_END,
                                   "FOR_END",
                                   TokenPattern.REGEXP_TYPE,
                                   "\\$endfor\\s+");
        addPattern(pattern);

        pattern = new TokenPattern(HtmlConstants.CALL_START,
                                   "CALL_START",
                                   TokenPattern.REGEXP_TYPE,
                                   "\\$call\\s+");
        addPattern(pattern);

        pattern = new TokenPattern(HtmlConstants.PRINT,
                                   "PRINT",
                                   TokenPattern.REGEXP_TYPE,
                                   "\\$print\\s+");
        addPattern(pattern);

        pattern = new TokenPattern(HtmlConstants.PARSED_LITERAL,
                                   "PARSED_LITERAL",
                                   TokenPattern.REGEXP_TYPE,
                                   "\\$\\\"[^\"]*\\\"\\s*");
        addPattern(pattern);

        pattern = new TokenPattern(HtmlConstants.VARIABLE,
                                   "VARIABLE",
                                   TokenPattern.REGEXP_TYPE,
                                   "\\$[a-zA-Z][a-zA-Z0-9]*\\s*");
        addPattern(pattern);

        pattern = new TokenPattern(HtmlConstants.LITERAL,
                                   "LITERAL",
                                   TokenPattern.REGEXP_TYPE,
                                   "[^$]+");
        addPattern(pattern);
    }
}
