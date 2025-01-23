/** import the utilities to test **/

const localeUtils = require( "../src/LocaleUtils.cjs" );

const { classes } = localeUtils;

const {
    ResourceKey,
    Resource,
    ResourceMap,
    ResourceCollection,
    ResourceBundle
} = classes;

describe( "resolveLocale", () =>
{
    test( "resolveLocale returns the correct Locale for a locale string",
          () =>
          {
              let s = "es_MX";

              let locale = localeUtils.resolveLocale( s );

              expect( new Intl.Locale( "es-MX" ) ).toEqual( locale );


              s = "en-GB";

              locale = localeUtils.resolveLocale( s );

              expect( locale?.baseName ).toEqual( s );


              locale = localeUtils.resolveLocale( new Intl.Locale( "es-MX" ) );

              expect( locale?.baseName ).toEqual( "es-MX" );
          } );
} );

describe( "Defaults", () =>
{
    test( "DEFAULT_LOCALE_STRING is en-US",
          () =>
          {
              expect( localeUtils.DEFAULT_LOCALE_STRING ).toEqual( new Intl.Locale( "en-US" )?.baseName );
          } );

    test( "isDefaultLocale returns true if the Locale is en-US",
          () =>
          {
              expect( localeUtils.isDefaultLocale( new Intl.Locale( "en-US" ) ) ).toBe( true );
              expect( localeUtils.isDefaultLocale( new Intl.Locale( "de" ) ) ).toBe( false );
          } );

    test( "isDefaultLanguage returns true if the Locale is en",
          () =>
          {
              expect( localeUtils.isDefaultLanguage( new Intl.Locale( "en-US" ) ) ).toBe( true );
              expect( localeUtils.isDefaultLanguage( new Intl.Locale( "en-GB" ) ) ).toBe( true );
              expect( localeUtils.isDefaultLanguage( new Intl.Locale( "de" ) ) ).toBe( false );
          } );
} );

describe( "Comparisons", () =>
{
    test( "isSameLocale returns true if the Locales have the same baseName",
          () =>
          {
              const usLocale = new Intl.Locale( "en-US" );
              const germanLocale = new Intl.Locale( "de" );

              expect( localeUtils.isSameLocale( usLocale, "en-US" ) ).toBe( true );
              expect( localeUtils.isSameLocale( germanLocale, usLocale ) ).toBe( false );
          } );

    test( "isSameLanguage returns true if the Locale is en",
          () =>
          {
              const usLocale = new Intl.Locale( "en-US" );
              const britishLocale = new Intl.Locale( "en-GB" );
              const germanLocale = new Intl.Locale( "de" );

              expect( localeUtils.isSameLanguage( usLocale, britishLocale ) ).toBe( true );
              expect( localeUtils.isSameLanguage( britishLocale, "en-US" ) ).toBe( true );
              expect( localeUtils.isSameLanguage( usLocale, germanLocale ) ).toBe( false );
              expect( localeUtils.isSameLanguage( britishLocale, germanLocale ) ).toBe( false );
          } );
} );

describe( "Months", () =>
{
    test( "getMonthNames returns the correct values based on the specified Locale",
          () =>
          {
              const usLocale = new Intl.Locale( "en-US" );
              const britishLocale = new Intl.Locale( "en-GB" );
              const germanLocale = new Intl.Locale( "de" );
              const mexicanLocale = new Intl.Locale( "es-MX" );

              const usMonths = localeUtils.getMonthNames( usLocale );
              const britishMonths = localeUtils.getMonthNames( britishLocale );
              const germanMonths = localeUtils.getMonthNames( germanLocale );
              const spanishMonths = localeUtils.getMonthNames( mexicanLocale );

              expect( usMonths ).toEqual( localeUtils.DEFAULTS.MONTH_NAMES );
              expect( britishMonths ).toEqual( localeUtils.DEFAULTS.MONTH_NAMES );

              expect( germanMonths ).toEqual( ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"] );

              expect( spanishMonths ).toEqual( ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] );

          } );

    test( "getMonthAbbreviations returns the correct values based on the specified Locale",
          () =>
          {
              const usLocale = new Intl.Locale( "en-US" );
              const britishLocale = new Intl.Locale( "en-GB" );
              const germanLocale = new Intl.Locale( "de" );
              const mexicanLocale = new Intl.Locale( "es-MX" );

              const usMonths = localeUtils.getMonthAbbreviations( usLocale );
              const britishMonths = localeUtils.getMonthAbbreviations( britishLocale );
              const germanMonths = localeUtils.getMonthAbbreviations( germanLocale );
              const spanishMonths = localeUtils.getMonthAbbreviations( mexicanLocale );

              expect( usMonths ).toEqual( localeUtils.DEFAULTS.MONTH_NAMES_SHORT );

              expect( britishMonths ).toEqual( localeUtils.DEFAULTS.MONTH_NAMES_SHORT.map( e => "Sep" === e ? "Sept" : e ) );

              expect( germanMonths ).toEqual( ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"] );

              expect( spanishMonths ).toEqual( ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sept", "oct", "nov", "dic"] );

          } );

    test( "getMonthLetters returns the correct values based on the specified Locale",
          () =>
          {
              const usLocale = new Intl.Locale( "en-US" );
              const britishLocale = new Intl.Locale( "en-GB" );
              const germanLocale = new Intl.Locale( "de" );
              const mexicanLocale = new Intl.Locale( "es-MX" );

              const usMonths = localeUtils.getMonthLetters( usLocale );
              const britishMonths = localeUtils.getMonthLetters( britishLocale );
              const germanMonths = localeUtils.getMonthLetters( germanLocale );
              const spanishMonths = localeUtils.getMonthLetters( mexicanLocale );

              expect( usMonths ).toEqual( localeUtils.DEFAULTS.MONTH_LETTERS );

              expect( britishMonths ).toEqual( localeUtils.DEFAULTS.MONTH_LETTERS );

              expect( germanMonths ).toEqual( ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"] );

              expect( spanishMonths ).toEqual( ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"] );

          } );

} );


describe( "Days", () =>
{
    test( "getDayNames returns the correct values based on the specified Locale",
          () =>
          {
              const usLocale = new Intl.Locale( "en-US" );
              const britishLocale = new Intl.Locale( "en-GB" );
              const germanLocale = new Intl.Locale( "de" );
              const mexicanLocale = new Intl.Locale( "es-MX" );

              const usDays = localeUtils.getDayNames( usLocale );
              const britishDays = localeUtils.getDayNames( britishLocale );
              const germanDays = localeUtils.getDayNames( germanLocale );
              const spanishDays = localeUtils.getDayNames( mexicanLocale );

              expect( usDays ).toEqual( localeUtils.DEFAULTS.DAY_NAMES );
              expect( britishDays ).toEqual( localeUtils.DEFAULTS.DAY_NAMES );

              expect( germanDays ).toEqual( ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"] );

              expect( spanishDays ).toEqual( ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"] );

          } );

    test( "getDayAbbreviations returns the correct values based on the specified Locale",
          () =>
          {
              const usLocale = new Intl.Locale( "en-US" );
              const britishLocale = new Intl.Locale( "en-GB" );
              const germanLocale = new Intl.Locale( "de" );
              const mexicanLocale = new Intl.Locale( "es-MX" );

              const usMonths = localeUtils.getDayAbbreviations( usLocale );
              const britishMonths = localeUtils.getDayAbbreviations( britishLocale );
              const germanMonths = localeUtils.getDayAbbreviations( germanLocale );
              const spanishMonths = localeUtils.getDayAbbreviations( mexicanLocale );

              expect( usMonths ).toEqual( localeUtils.DEFAULTS.DAY_NAMES_SHORT );

              expect( britishMonths ).toEqual( localeUtils.DEFAULTS.DAY_NAMES_SHORT );

              expect( germanMonths ).toEqual( ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"] );

              expect( spanishMonths ).toEqual( ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] );

          } );

    test( "getDayLetters returns the correct values based on the specified Locale",
          () =>
          {
              const usLocale = new Intl.Locale( "en-US" );
              const britishLocale = new Intl.Locale( "en-GB" );
              const germanLocale = new Intl.Locale( "de" );
              const mexicanLocale = new Intl.Locale( "es-MX" );

              const usMonths = localeUtils.getDayLetters( usLocale );
              const britishMonths = localeUtils.getDayLetters( britishLocale );
              const germanMonths = localeUtils.getDayLetters( germanLocale );
              const spanishMonths = localeUtils.getDayLetters( mexicanLocale );

              expect( usMonths ).toEqual( localeUtils.DEFAULTS.DAY_LETTERS );

              expect( britishMonths ).toEqual( localeUtils.DEFAULTS.DAY_LETTERS.map( e => e.slice( 0, 1 ) ).map( e => "R" === e ? "T" : e ) );

              expect( germanMonths ).toEqual( ["S", "M", "D", "M", "D", "F", "S"] );

              expect( spanishMonths ).toEqual( ["D", "L", "M", "M", "J", "V", "S"] );

          } );
} );

describe( "Other", () =>
{
    const usLocale = new Intl.Locale( "en-US" );
    const britishLocale = new Intl.Locale( "en-GB" );
    const germanLocale = new Intl.Locale( "de" );
    const mexicanLocale = new Intl.Locale( "es-MX" );
    const frenchLocale = new Intl.Locale( "fr-FR" );
    const japaneseLocale = new Intl.Locale( "ja-JP" );

    test( "getEras returns an array of objects describing the known Eras",
          () =>
          {
              let eras = localeUtils.getEras( usLocale );

              expect( eras[0].name ).toEqual( "AD" );
              expect( eras[1].name ).toEqual( "BC" );

              expect( eras[0].longName ).toEqual( "Anno Domini" );
              expect( eras[1].longName ).toEqual( "Before Common Era" );

              eras = localeUtils.getEras( britishLocale );

              expect( eras[0].longName ).toEqual( "Anno Domini" );
              expect( eras[1].longName ).toEqual( "Before Christ" );

              eras = localeUtils.getEras( germanLocale );

              expect( eras[0].longName ).toEqual( ".. n. Chr." );
              expect( eras[1].longName ).toEqual( ".. v. Chr." );

              eras = localeUtils.getEras( mexicanLocale );

              expect( eras[0].longName ).toEqual( "después de Cristo" );
              expect( eras[1].longName ).toEqual( "antes de Cristo" );
          } );

    test( "getAmPmStrings returns an array of strings used for AM/PM according to the Locale specified",
          () =>
          {
              let amPmStrings = localeUtils.getAmPmStrings( usLocale );

              expect( amPmStrings[0] ).toEqual( "AM" );
              expect( amPmStrings[1] ).toEqual( "PM" );

              amPmStrings = localeUtils.getAmPmStrings( britishLocale );

              expect( amPmStrings[0] ).toEqual( "am" );
              expect( amPmStrings[1] ).toEqual( "pm" );

              amPmStrings = localeUtils.getAmPmStrings( germanLocale );

              expect( amPmStrings[0] ).toEqual( "AM" );
              expect( amPmStrings[1] ).toEqual( "PM" );

              amPmStrings = localeUtils.getAmPmStrings( mexicanLocale );

              expect( amPmStrings[0] ).toEqual( "a. m." );
              expect( amPmStrings[1] ).toEqual( "p. m." );
          } );

    test( "getWeekData returns an object describing various aspects of a locale's rules for weeks",
          () =>
          {
              let weekInfo = localeUtils.getWeekData( usLocale );

              expect( weekInfo ).toEqual( { firstDay: 0, minimalDays: 1, weekend: [6, 0] } );


              weekInfo = localeUtils.getWeekData( britishLocale );

              expect( weekInfo ).toEqual( { firstDay: 1, minimalDays: 4, weekend: [6, 0] } );


              weekInfo = localeUtils.getWeekData( frenchLocale );

              expect( weekInfo ).toEqual( { firstDay: 1, minimalDays: 4, weekend: [6, 0] } );


              weekInfo = localeUtils.getWeekData( germanLocale );

              expect( weekInfo ).toEqual( { firstDay: 1, minimalDays: 4, weekend: [6, 0] } );


              weekInfo = localeUtils.getWeekData( mexicanLocale );

              expect( weekInfo ).toEqual( { firstDay: 0, minimalDays: 1, weekend: [6, 0] } );
          } );

    test( "getFirstDayOfWeek returns Sunday or Monday depending on the Locale",
          () =>
          {
              let day = localeUtils.getFirstDayOfWeek( usLocale );

              expect( day ).toEqual( 0 );


              day = localeUtils.getFirstDayOfWeek( britishLocale );

              expect( day ).toEqual( 1 );


              day = localeUtils.getFirstDayOfWeek( frenchLocale );

              expect( day ).toEqual( 1 );


              day = localeUtils.getFirstDayOfWeek( germanLocale );

              expect( day ).toEqual( 1 );


              day = localeUtils.getFirstDayOfWeek( mexicanLocale );

              expect( day ).toEqual( 0 );
          } );

    test( "getWords returns an array of strings considered to be 'words' according to the specified locale or detected language",
          () =>
          {
              const english = "We're off to see the wizard, the wonderful wizard of Oz";

              const englishWords = ["We're", "off", "to", "see", "the", "wizard", ",", "the", "wonderful", "wizard", "of", "Oz"];

              const englishWordsOnly = ["We're", "off", "to", "see", "the", "wizard", "the", "wonderful", "wizard", "of", "Oz"];

              const japanese = "吾輩は猫である。名前はたぬき。";

              const japaneseWords = ["吾輩", "は", "猫", "で", "ある", "。", "名前", "は", "たぬき", "。"];

              const japaneseWordsOnly = ["吾輩", "は", "猫", "で", "ある", "名前", "は", "たぬき"];


              let words = localeUtils.getWords( english, usLocale );

              expect( words ).toEqual( englishWords );

              words = localeUtils.getWords( english, usLocale, true, true );

              expect( words ).toEqual( englishWordsOnly );


              words = localeUtils.getWords( japanese, usLocale );

              expect( words ).toEqual( japaneseWords );

              words = localeUtils.getWords( japanese, usLocale, true, true );

              expect( words ).toEqual( japaneseWordsOnly );


              words = localeUtils.getWords( english, japaneseLocale );

              expect( words ).toEqual( englishWords );


              words = localeUtils.getWords( japanese, japaneseLocale );

              expect( words ).toEqual( japaneseWords );


              words = localeUtils.getWords( english, britishLocale );

              expect( words ).toEqual( englishWords );


              words = localeUtils.getWords( japanese, britishLocale );

              expect( words ).toEqual( japaneseWords );


              words = localeUtils.getWords( english, frenchLocale );

              expect( words ).toEqual( englishWords );


              words = localeUtils.getWords( japanese, frenchLocale );

              expect( words ).toEqual( japaneseWords );


              words = localeUtils.getWords( english, germanLocale );

              expect( words ).toEqual( englishWords );


              words = localeUtils.getWords( japanese, germanLocale );

              expect( words ).toEqual( japaneseWords );


              words = localeUtils.getWords( english, mexicanLocale );

              expect( words ).toEqual( englishWords );


              words = localeUtils.getWords( japanese, mexicanLocale );

              expect( words ).toEqual( japaneseWords );
          } );
} );
