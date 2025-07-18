// Simple HUML mode for CodeMirror 5 - direct registration.
CodeMirror.defineMode("huml", function () {
    // Patterns.
    var keywords = /^(true|false|null|True|False|Null|TRUE|FALSE|NULL)$/;
    var numberRegex = /^-?(?:0(?:[xX][0-9a-fA-F_]+|[oO][0-7_]+|[bB][01_]+)|[0-9_]+(?:\.[0-9_]+)?(?:[eE][+-]?[0-9_]+)?)/;
    var keyWithDoubleColon = /^[^:#]+::/;
    var keyWithColon = /^[^:#]+:/;
    var quotedKey = /^"[^"]+"\s*:/;
    var listMarker = /^-\s+/;

    return {
        startState: function () {
            return {
                inMultilineString: null,
                multilineStringIndent: 0,
                inlineLevel: 0,
                expectValue: false,
                lastIndent: 0
            };
        },

        token: function (stream, state) {
            // Handle multiline strings.
            if (state.inMultilineString) {
                // Look for the closing delimiter
                var closeDelim = state.inMultilineString;
                var content = stream.string.slice(stream.pos);
                var closeIndex = content.indexOf(closeDelim);

                if (closeIndex >= 0) {
                    // Found closing delimiter - consume everything up to and including it
                    stream.pos += closeIndex + closeDelim.length;
                    state.inMultilineString = null;
                    state.multilineStringIndent = 0;
                    return "string";
                } else {
                    // No closing delimiter on this line - consume rest of line
                    stream.skipToEnd();
                    return "string";
                }
            }

            // Handle start of line.
            if (stream.sol()) {
                state.lastIndent = stream.indentation();
                state.expectValue = false;
            }

            // Skip whitespace.
            if (stream.eatSpace()) return null;

            // Comments.
            if (stream.match(/^#.*/)) {
                return "comment";
            }

            // Multiline string starters.
            if (stream.match('"""')) {
                var delimiter = '"""';
                state.inMultilineString = delimiter;
                state.multilineStringIndent = stream.indentation();

                // Check if closing delimiter is on the same line.
                var remaining = stream.string.slice(stream.pos);
                var closeIndex = remaining.indexOf(delimiter);

                if (closeIndex >= 0) {
                    // Closing delimiter on same line - consume everything including closing delimiter.
                    stream.pos += closeIndex + delimiter.length;
                    state.inMultilineString = null;
                    state.multilineStringIndent = 0;
                } else {
                    // No closing delimiter on this line - consume rest of line.
                    stream.skipToEnd();
                }
                return "string";
            }
            if (stream.match('```')) {
                var delimiter = '```';
                state.inMultilineString = delimiter;
                state.multilineStringIndent = stream.indentation();

                // Check if closing delimiter is on the same line
                var remaining = stream.string.slice(stream.pos);
                var closeIndex = remaining.indexOf(delimiter);

                if (closeIndex >= 0) {
                    // Closing delimiter on same line - consume everything including closing delimiter.
                    stream.pos += closeIndex + delimiter.length;
                    state.inMultilineString = null;
                    state.multilineStringIndent = 0;
                } else {
                    // No closing delimiter on this line - consume rest of line.
                    stream.skipToEnd();
                }
                return "string";
            }

            // Keys (before expecting value).
            if (!state.expectValue) {
                // Quoted key.
                if (stream.match(quotedKey)) {
                    state.expectValue = true;
                    return "atom";
                }
                // Key with ::.
                if (stream.match(keyWithDoubleColon)) {
                    state.expectValue = true;
                    return "atom";
                }
                // Regular key with :.
                if (stream.match(keyWithColon)) {
                    state.expectValue = true;
                    return "atom";
                }
            }

            // List item marker.
            if (stream.match(listMarker)) {
                state.expectValue = true;
                return "punctuation";
            }

            // Values.
            // Quoted strings.
            if (stream.match(/^"([^"\\]|\\.)*"/) || stream.match(/^'([^'\\]|\\.)*'/)) {
                return "string";
            }

            // Numbers.
            if (stream.match(numberRegex)) {
                return "number";
            }

            // Keywords (booleans and null).
            if (stream.match(keywords)) {
                return "keyword";
            }

            // Inline collection brackets.
            if (stream.eat('[') || stream.eat('{')) {
                state.inlineLevel++;
                return "bracket";
            }
            if (stream.eat(']') || stream.eat('}')) {
                state.inlineLevel--;
                return "bracket";
            }

            // Comma in inline collections.
            if (stream.eat(',')) {
                return "punctuation";
            }

            // Double colon for nested dict marker when used alone.
            if (stream.match('::')) {
                return "punctuation strong";
            }

            // Default - consume one character.
            stream.next();
            return null;
        },

        lineComment: '#',
        fold: 'indent'
    };
});

CodeMirror.defineMIME("text/x-huml", "huml");
