/**
 * Stores the information about a cookie category
 * As well as translation data to describe the category
 */
declare class CookieCategory {
    name: string;
    required: boolean;
    onenable: string;
    ondisable: string;
    isAllowed: boolean;
    gtmconsentstate: string;
    translation: {
        displayname: string;
        description: string;
    };
}
/**
 * Stores the information about a cookie
 * As well as translation data to describe the cookie
 */
declare class CookieData {
    name: string;
    category: string;
    httponly: boolean;
    regex: RegExp | undefined;
    translation: {
        name: string;
        description: string;
        moreinfo?: string;
    };
    constructor(name: string, category: string, httponly: boolean, regex?: string);
}
/**
 * Used to serialize the data in the cookie keeping track of the user's consent
 */
declare class ConsentCookie {
    allowedCategories: {
        [key: string]: boolean;
    };
    firstVisit: boolean;
}
/**
 * Stores general configration for the cookie consent
 */
declare class ConsentConfig {
    fallbacklanguage: string;
    showformoninit: boolean;
    showformoninitdelay: number;
    parentelement: string;
    preventonpaths: string[];
    enabletagmanagerconsent: boolean;
}
/**
 * Stores general translation data for the cookie consent form
 */
declare class GeneralConsentTexts {
    title: string;
    description: string;
    policylink: string;
    policylinktext: string;
    dismiss: string;
    allowall: string;
    denyall: string;
    allow: string;
    deny: string;
    cookies: string;
    cookiemoreinfotext: string;
}
declare enum LogLevel {
    error = 1,
    warn = 2,
    debug = 3
}
declare enum GtmConsentStateType {
    ad_storage = "ad_storage",
    analytics_storage = "analytics_storage",
    functionality_storage = "functionality_storage",
    personalization_storage = "personalization_storage",
    security_storage = "security_storage"
}
declare enum GtmConsentState {
    denied = "denied",
    granted = "granted"
}
declare class CookieConsent {
    consentCookie: ConsentCookie;
    private allCategories;
    private allCookies;
    private config;
    private texts;
    private fullDomain;
    private topLevelDomain;
    private currentPath;
    private pathPermutations;
    private resourcePath;
    private resourcePathTranslations;
    private resourcePathConfigs;
    private consentCookieName;
    private wrapper;
    private logLevel;
    private anyWindow;
    constructor();
    /**
     * Helper method to get a category by name
     * @param name Name of the category
     * @returns A CookieCategory object or undefined if not found
     */
    private getCategoryByName;
    /**
     * Helper method to get all cookies belonging to a category.
     * @param category The category object to get the cookies for
     * @returns An array of CookieData objects
     */
    private getCookiesOfCategory;
    /**
     * Helper method to create a DOM element from a string
     * @param tag The string to create the element from
     * @returns a DOM element
     */
    private createElement;
    /**
     * Helper method to log an error
     * @param message The message to log
     */
    private logError;
    /**
     * Helper method to log a warning
     * @param message The message to log
     */
    private logWarning;
    /**
     * Helper method to log a debug message
     * @param message The message to log
     */
    private logDebug;
    /**
     * Helper method to disable a script tag
     * @param scriptTag The script tag to disable
     */
    private disableScriptTag;
    /**
     * Helper method to enable a disabled script tag
     * @param noscriptTag The script tag to enable
     */
    private enableScriptTag;
    /**
     * Helper method to find all script tags for a category
     * @param category The category to find the script tags for
     * @returns
     */
    private findEnabledScriptTagsForCategory;
    /**
     * Helper method to find all disabled script tags for a category
     * @param category The category to find the script tags for
     * @returns
     */
    private findDisabledScriptTagsForCategory;
    /**
     * Helper method to create a new cookie to store the consent
     */
    private createNewCookie;
    /**
     * Helper method to parse an existing cookie and enable/disable scripts accordingly
     */
    private parseCookieData;
    /**
     * Helper method to fetch or create the cookie keeping track of the consent
     */
    private loadFromCookie;
    /**
     * Helper method to save the cookie keeping track of the consent
     */
    private saveToCookie;
    /**
     * Helper method to fetch the translations for the current language or the fallback language
     */
    private loadTranslations;
    /**
     * Helper method to create the consent form
     */
    private createConsentForm;
    /**
     * Helper method to create the header of the consent form
     * @returns A dom element containing the header
     */
    private createFormHeader;
    /**
     * Helper method to create the allow/deny all buttons of the consent form
     * @returns A dom element containing the buttons
     */
    private createFormButtonSection;
    /**
     * Helper method to create the category section of the consent form
     * @returns A dom element containing the categories
     */
    private createFormCategorySection;
    /**
     * Create a list of cookies for a category
     * @param cookiesForCategory Cookies of a category
     * @returns A dom element containing the list of cookies
     */
    private createFormCategoryCookieList;
    /**
     * Helper method to create the info of a single category
     * @param category The category object
     * @returns A dom element containing the category info
     */
    private createFormCategory;
    /**
     * Helper method to create the footer of the consent form
     * @returns A dom element containing the footer
     */
    private createFormFooter;
    /**
     * Event method for the category button
     * @param button The button that was clicked
     */
    onCategoryButtonChange(button: HTMLButtonElement): void;
    /**
     * Helper method to update the state of a category button
     * @param category The category that was updated
     */
    private updateButtonState;
    /**
     * Helper method to add a class to an element
     * Made to avoid using classList for better browser support
     * @param element Element to add the class to
     * @param className The class to add
     */
    private addClass;
    /**
    * Helper method to remove a class to an element
    * Made to avoid using classList for better browser support
    * @param element Element to remove the class from
    * @param className The class to remove
    */
    private removeClass;
    /**
     * Method to call to close the consent form
     */
    closeConsentForm(): void;
    /**
     * Method to call to show the consent form
     */
    showConsentForm(): void;
    /**
     * Helper method to find and enable all script tags for a category
     * @param category The category that was accepted
     */
    private enableAllScriptsForCategory;
    /**
     * Helper method to find and disable all script tags for a category
     * @param category The category that was denied
     */
    private disableAllScriptsForCategory;
    /**
     * Helper method to execute potential onenable function of a category
     * @param category The category that was accepted
     */
    private executeOnEnable;
    /**
     * Helper method to execute potential ondisable function of a category
     * @param category The category that was denied
     */
    private executeOnDisable;
    /**
     * Helper method to remove all cookies of a category
     * @param category The category that was denied
     */
    private deleteCookiesOfCategory;
    /**
     * Helper method to make sure the cookie is deleted.
     * Since I can't see path or domain in the cookie from javascript, it needs to go through all possible combinations, since you must target it exactly.
     * This is a bit of a hack, but it works.
     * @param cookieName The name of the cookie to delete
     */
    private loopThroughPathsAndDomains;
    /**
     * Helper method to check if a cookie exists
     * @param cookieName The name of the cookie to check
     * @returns True if the cookie exists, false otherwise
     */
    private cookieExists;
    private updateGtmConsentState;
    /**
     * Call to allow a single category
     * @param category The category to allow
     */
    allowCategory(category: CookieCategory, save?: boolean, updateButtonState?: boolean): void;
    /**
     * Call to deny a single category
     * @param category The category to deny
     */
    denyCategory(category: CookieCategory, save?: boolean, updateButtonState?: boolean): void;
    /**
     * Call to allow all categories
     */
    allowAll(): void;
    /**
     * Call to deny all categories (except required ones)
     */
    denyAll(): void;
    /**
     * Helper method to generate all possible path permutations
     * Used when deleting cookies
     */
    private getPathPermutations;
    /**
     * Helper method to inject the stylesheet
     */
    private loadStyleSheet;
    private initGoogleTagManager;
    /**
     * Initialize the coookie consent tracker
     */
    init(): Promise<void>;
    private waitForGtag;
}
