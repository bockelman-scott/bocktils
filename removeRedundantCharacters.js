/**
 * Helper function to escape special characters in a string for RegExp construction.
 * (Assumed to be defined elsewhere, but included for completeness).
 * @param {string} string - The string pattern to escape.
 * @returns {string} - The escaped string.
 */
function _escape(string) {
    // Escapes all 12 special RegExp characters: [.*+?^${}()|[\]\\]
    return String(string).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Removes repeated, consecutive occurrences of specified characters/sequences 
 * from a string, reducing them to a single instance of the character/sequence.
 * * NOTE: This function includes a 'do-while' loop to ensure convergence, which
 * handles complex cascading replacements where one reduction creates a new 
 * redundancy that must be caught in a subsequent pass.
 * * * NOTE: This relies on external helper functions: _spc, _toArr, asString, _mt, $ln
 * * @param {string} pStr - The input string.
 * @param {any} pCharacters - A value (or array of values) to convert into character sequences to check for redundancy. 
 * Defaults to a single space character: [_spc].
 * @returns {string} - The string with redundant occurrences removed.
 */
const removeRedundant = function( pStr, pCharacters = [_spc] )
{
    // Assume helper functions handle array conversion, stringification, and filtering of empty chars.
    let chars = _toArr( pCharacters || [] ).map( asString ).filter( e => ($ln( e ) > 0) );

    // Assume helper functions handle initial string preparation
    let s = _mt + asString( pStr, chars.includes( _spc ) );
    
    // Safety measures to prevent infinite loops and track state
    let prior = s;
    let iterations = 0;
    // Set a safety limit based on string length.
    // We will use the user's suggested calculation for maxIterations.
    const maxIterations = $ln(s); 

    // Loop until no replacements occur during a full pass (convergence)
    // OR until the safety limit is reached.
    do {
        prior = s; // Capture state before replacement attempts
        
        chars.forEach( c =>
        {
            // 1. Escape the character/sequence for safe RegExp usage.
            const escapedChar = _escape(c);

            // 2. Wrap the escaped pattern in parentheses () to group it.
            //    Example: if c is 'ab', pattern is /(ab){2,}/g
            const pattern = new RegExp( `(${escapedChar}){2,}`, "g" );

            // 3. Replace the sequence (2 or more repetitions) with a single instance of c.
            s = s.replaceAll( pattern, String(c) );
        });

        // The convergence check is performed in the while condition:
        // 1. s !== prior: Was a replacement made?
        // 2. $ln(s) > 0: Is the string still valid?
        // 3. iterations++ < maxIterations: Did we hit the safety limit?
        iterations++;
    } while ( s !== prior && $ln( s ) > 0 && iterations < maxIterations );

    return s;
};

// Assuming placeholder definitions for testing:
const _spc = ' ';
const _mt = '';
const $ln = (e) => e.length;
const _toArr = (e) => Array.isArray(e) ? e : [e];
const asString = (e) => String(e);

// --- Examples ---
const initialString = "a string with   extra internal  spaces...!!!";
console.log(`Initial: "${initialString}"`);

// Example 1: Reducing multiple spaces to a single space
let result1 = removeRedundant(initialString, [_spc]);
console.log(`Result 1 (Spaces): "${result1}"`); 
// Expected: "a string with extra internal spaces...!!!"

// Example 2: Reducing multiple periods and spaces
let result2 = removeRedundant(initialString, [_spc, '.']);
console.log(`Result 2 (Spaces and Periods): "${result2}"`); 
// Expected: "a string with extra internal spaces.!!!"

// Example 3: Demonstrating multi-character sequence reduction (e.g., 'ab')
let complexString = "This is an ababab string with aaaaa too.";
let result3 = removeRedundant(complexString, ['ab', 'a']);
console.log(`Result 3 (Sequences 'ab' and 'a'): "${result3}"`); 
// Expected: "This is an ab string with a too."

// Example 4: Testing the cascading/convergence case
const cascadingString = "X-=-=-=Y";
// Assume we process '-' then '-='
// 1. Pass 1 (for '-'): X-=-=-=Y -> X-=--=Y
// 2. Pass 1 (for '-='): X-=--=Y -> X-=Y 
// A loop ensures all reductions are caught regardless of replacement order.
console.log(`Initial Cascading: "${cascadingString}"`);
let result4 = removeRedundant(cascadingString, ['-', '=']);
console.log(`Result 4 (Cascading with '-' and '='): "${result4}"`); 
// Expected: "X-=-=Y" (Reduction of only '==' if it existed)
