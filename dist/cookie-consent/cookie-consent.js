"use strict";
/**
 * Stores the information about a cookie category
 * As well as translation data to describe the category
 */
class CookieCategory {
    name = "";
    required = false;
    onenable = "";
    ondisable = "";
    isAllowed = false;
    gtmconsentstate = "";
    translation = { displayname: "", description: "" };
}
/**
 * Stores the information about a cookie
 * As well as translation data to describe the cookie
 */
class CookieData {
    name = "";
    category = "";
    httponly = false;
    regex = undefined;
    translation = { name: "", description: "" };
    constructor(name, category, httponly, regex) {
        this.name = name;
        this.category = category;
        this.httponly = httponly;
        if (regex) {
            this.regex = new RegExp(regex);
        }
    }
}
/**
 * Used to serialize the data in the cookie keeping track of the user's consent
 */
class ConsentCookie {
    allowedCategories = {};
    firstVisit = true;
}
/**
 * Stores general configration for the cookie consent
 */
class ConsentConfig {
    fallbacklanguage = "";
    showformoninit = true;
    showformoninitdelay = 0;
    parentelement = "";
    preventonpaths = [];
    enabletagmanagerconsent = false;
}
/**
 * Stores general translation data for the cookie consent form
 */
class GeneralConsentTexts {
    title = "";
    description = "";
    policylink = "";
    policylinktext = "";
    dismiss = "";
    allowall = "";
    denyall = "";
    allow = "";
    deny = "";
    cookies = "";
    cookiemoreinfotext = "";
}
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["error"] = 1] = "error";
    LogLevel[LogLevel["warn"] = 2] = "warn";
    LogLevel[LogLevel["debug"] = 3] = "debug";
})(LogLevel || (LogLevel = {}));
var GtmConsentStateType;
(function (GtmConsentStateType) {
    GtmConsentStateType["ad_storage"] = "ad_storage";
    GtmConsentStateType["analytics_storage"] = "analytics_storage";
    GtmConsentStateType["functionality_storage"] = "functionality_storage";
    GtmConsentStateType["personalization_storage"] = "personalization_storage";
    GtmConsentStateType["security_storage"] = "security_storage";
})(GtmConsentStateType || (GtmConsentStateType = {}));
var GtmConsentState;
(function (GtmConsentState) {
    GtmConsentState["denied"] = "denied";
    GtmConsentState["granted"] = "granted";
})(GtmConsentState || (GtmConsentState = {}));
class CookieConsent {
    consentCookie = new ConsentCookie();
    allCategories = [];
    allCookies = [];
    config = new ConsentConfig();
    texts = new GeneralConsentTexts();
    fullDomain = window.location.hostname;
    topLevelDomain = this.fullDomain.split(".").slice(-2).join(".");
    currentPath = window.location.pathname.replace(/\/$/, "");
    pathPermutations = [];
    resourcePath = "dist/cookie-consent";
    resourcePathTranslations = `${this.resourcePath}/translations`;
    resourcePathConfigs = `${this.resourcePath}/configs`;
    consentCookieName = "cookie-consent";
    wrapper = null;
    logLevel = LogLevel.debug;
    anyWindow = window;
    constructor() {
    }
    /**
     * Helper method to get a category by name
     * @param name Name of the category
     * @returns A CookieCategory object or undefined if not found
     */
    getCategoryByName(name) {
        return this.allCategories.find(c => c.name === name);
    }
    /**
     * Helper method to get all cookies belonging to a category.
     * @param category The category object to get the cookies for
     * @returns An array of CookieData objects
     */
    getCookiesOfCategory(category) {
        return this.allCookies.filter(c => c.category === category.name);
    }
    /**
     * Helper method to create a DOM element from a string
     * @param tag The string to create the element from
     * @returns a DOM element
     */
    createElement(tag) {
        const range = document.createRange();
        return range.createContextualFragment(tag);
    }
    /**
     * Helper method to log an error
     * @param message The message to log
     */
    logError(...message) {
        if (this.logLevel >= LogLevel.error) {
            console.error("[CookieConsent][ERROR]", ...message);
        }
    }
    /**
     * Helper method to log a warning
     * @param message The message to log
     */
    logWarning(...message) {
        if (this.logLevel >= LogLevel.warn) {
            console.warn("[CookieConsent][WARN]", ...message);
        }
    }
    /**
     * Helper method to log a debug message
     * @param message The message to log
     */
    logDebug(...message) {
        if (this.logLevel >= LogLevel.debug) {
            console.debug("[CookieConsent][DEBUG]", ...message);
        }
    }
    /**
     * Helper method to disable a script tag
     * @param scriptTag The script tag to disable
     */
    disableScriptTag(scriptTag) {
        if (!scriptTag) {
            throw new Error("Script tag is null");
        }
        if (!scriptTag.parentNode) {
            throw new Error("Script tag has no parent node");
        }
        const newTagString = scriptTag.outerHTML.replaceAll("script", "noscript");
        const newTag = this.createElement(newTagString);
        scriptTag.parentNode.replaceChild(newTag, scriptTag);
    }
    /**
     * Helper method to enable a disabled script tag
     * @param noscriptTag The script tag to enable
     */
    enableScriptTag(noscriptTag) {
        if (!noscriptTag) {
            throw new Error("Script tag is null");
        }
        if (!noscriptTag.parentNode) {
            throw new Error("Script tag has no parent node");
        }
        const newTagString = noscriptTag.outerHTML.replaceAll("noscript", "script");
        const newTag = this.createElement(newTagString);
        noscriptTag.parentNode.replaceChild(newTag, noscriptTag);
    }
    /**
     * Helper method to find all script tags for a category
     * @param category The category to find the script tags for
     * @returns
     */
    findEnabledScriptTagsForCategory(category) {
        const scripts = document.querySelectorAll(`script[data-cookie-category="${category.name}"]`);
        return Array.from(scripts);
    }
    /**
     * Helper method to find all disabled script tags for a category
     * @param category The category to find the script tags for
     * @returns
     */
    findDisabledScriptTagsForCategory(category) {
        const scripts = document.querySelectorAll(`noscript[data-cookie-category="${category.name}"]`);
        return Array.from(scripts);
    }
    /**
     * Helper method to create a new cookie to store the consent
     */
    createNewCookie() {
        this.consentCookie = new ConsentCookie();
        this.consentCookie.allowedCategories = {};
        for (const category of this.allCategories) {
            if (!category.required) {
                this.logDebug(`Disabling scripts for category ${category.name}`);
                this.consentCookie.allowedCategories[category.name] = false;
                this.disableAllScriptsForCategory(category);
                this.executeOnDisable(category);
                this.deleteCookiesOfCategory(category);
                category.isAllowed = false;
            }
            else {
                this.logDebug(`Enabling scripts for category ${category.name}`);
                this.enableAllScriptsForCategory(category);
                this.executeOnEnable(category);
                category.isAllowed = true;
            }
        }
        this.saveToCookie();
    }
    /**
     * Helper method to parse an existing cookie and enable/disable scripts accordingly
     */
    parseCookieData() {
        for (const category of this.allCategories) {
            if (this.consentCookie.allowedCategories[category.name] || category.required) {
                this.allowCategory(category, false, false);
            }
            else {
                this.denyCategory(category, false, false);
            }
        }
    }
    /**
     * Helper method to fetch or create the cookie keeping track of the consent
     */
    loadFromCookie() {
        const cookie = document.cookie.split("; ").find(row => row.startsWith(`${this.consentCookieName}=`));
        if (cookie) {
            const cookieValue = cookie.split("=")[1];
            if (cookieValue) {
                this.consentCookie = JSON.parse(cookieValue);
                if (this.consentCookie.allowedCategories) {
                    this.parseCookieData();
                }
                else {
                    this.createNewCookie();
                }
            }
        }
    }
    /**
     * Helper method to save the cookie keeping track of the consent
     */
    saveToCookie() {
        document.cookie = `${this.consentCookieName}=${JSON.stringify(this.consentCookie)}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT;`;
    }
    /**
     * Helper method to fetch the translations for the current language or the fallback language
     */
    async loadTranslations() {
        let lang = document.documentElement.lang;
        if (!lang) {
            this.logWarning("No language set on body tag. Using fallback language: " + this.config.fallbacklanguage);
            lang = this.config.fallbacklanguage;
        }
        let translations = await fetch(`${this.resourcePathTranslations}/${lang}.json`).then(response => response.json());
        if (!translations) {
            if (lang !== this.config.fallbacklanguage) {
                this.logWarning(`Could not load translations for language ${lang}. Using fallback language: ${this.config.fallbacklanguage}`);
                translations = await fetch(`${this.resourcePathTranslations}/${this.config.fallbacklanguage}.json`).then(response => response.json());
            }
        }
        if (!translations) {
            throw new Error(`Could not load translations for language ${lang} or fallback language ${this.config.fallbacklanguage}`);
        }
        this.allCategories.forEach(c => {
            const translation = translations.categories.find((t) => t.name === c.name);
            if (translation) {
                c.translation = translation;
            }
        });
        this.allCookies.forEach(c => {
            const translation = translations.cookies.find((t) => t.name === c.name);
            if (translation) {
                c.translation = translation;
            }
        });
        this.texts = translations.general;
    }
    /**
     * Helper method to create the consent form
     */
    createConsentForm() {
        const parentElement = document.querySelector(this.config.parentelement);
        if (!parentElement) {
            throw new Error("Could not find parent element with selector " + this.config.parentelement);
        }
        this.wrapper = document.getElementById("cookie-consent-form_wrapper");
        if (!this.wrapper) {
            this.wrapper = document.createElement("div");
            this.wrapper.id = "cookie-consent-form_wrapper";
        }
        else {
            this.wrapper.innerHTML = "";
        }
        // When created, it should be hidden in case the css is not loaded yet. Will be removed on call to showConsentForm()
        this.wrapper.style.display = "none";
        const form = document.createElement("div");
        form.id = "cookie-consent-form";
        this.wrapper.appendChild(form);
        form.appendChild(this.createFormHeader());
        form.appendChild(this.createFormButtonSection());
        form.appendChild(this.createFormCategorySection());
        form.appendChild(this.createFormFooter());
        parentElement.appendChild(this.wrapper);
    }
    /**
     * Helper method to create the header of the consent form
     * @returns A dom element containing the header
     */
    createFormHeader() {
        const header = document.createElement("div");
        header.id = "cookie-consent-form_header";
        const heading = document.createElement("h2");
        heading.id = "cookie-consent-form_heading";
        heading.innerText = this.texts.title;
        header.appendChild(heading);
        const description = document.createElement("p");
        description.id = "cookie-consent-form_description";
        description.innerText = this.texts.description;
        header.appendChild(description);
        const policyLink = document.createElement("a");
        policyLink.id = "cookie-consent-form_policylink";
        policyLink.href = this.texts.policylink;
        policyLink.target = "_blank";
        policyLink.innerText = this.texts.policylinktext;
        header.appendChild(policyLink);
        return header;
    }
    /**
     * Helper method to create the allow/deny all buttons of the consent form
     * @returns A dom element containing the buttons
     */
    createFormButtonSection() {
        const buttons = document.createElement("div");
        buttons.id = "cookie-consent-form_buttons";
        const acceptAllButton = document.createElement("button");
        acceptAllButton.id = "cookie-consent-form_buttons_acceptall";
        acceptAllButton.className = "cookie-consent-form_button";
        acceptAllButton.innerText = this.texts.allowall;
        acceptAllButton.onclick = () => {
            this.allowAll();
            this.closeConsentForm();
        };
        buttons.appendChild(acceptAllButton);
        const declineAllButton = document.createElement("button");
        declineAllButton.id = "cookie-consent-form_buttons_declineall";
        declineAllButton.className = "cookie-consent-form_button";
        declineAllButton.innerText = this.texts.denyall;
        declineAllButton.onclick = () => {
            this.denyAll();
            this.closeConsentForm();
        };
        buttons.appendChild(declineAllButton);
        return buttons;
    }
    /**
     * Helper method to create the category section of the consent form
     * @returns A dom element containing the categories
     */
    createFormCategorySection() {
        const categories = document.createElement("div");
        categories.id = "cookie-consent-form_categories";
        this.allCategories.forEach(c => categories.appendChild(this.createFormCategory(c)));
        return categories;
    }
    /**
     * Create a list of cookies for a category
     * @param cookiesForCategory Cookies of a category
     * @returns A dom element containing the list of cookies
     */
    createFormCategoryCookieList(cookiesForCategory) {
        const cookieList = document.createElement("div");
        cookieList.className = "cookie-consent-form_category_cookie_list";
        const cookieListHeading = document.createElement("h4");
        cookieListHeading.className = "cookie-consent-form_category_cookie_list_heading";
        cookieListHeading.innerText = this.texts.cookies;
        cookieList.appendChild(cookieListHeading);
        cookiesForCategory.forEach(c => {
            const details = document.createElement("details");
            details.className = "cookie-consent-form_category_cookie_list_item";
            const summary = document.createElement("summary");
            summary.innerText = c.translation.name;
            details.appendChild(summary);
            const description = document.createElement("p");
            description.className = "cookie-consent-form_category_cookie_list_item_description";
            description.innerText = c.translation.description;
            details.appendChild(description);
            if (c.translation.moreinfo && c.translation.moreinfo.length > 0) {
                const moreInfo = document.createElement("a");
                moreInfo.className = "cookie-consent-form_category_cookie_list_item_moreinfo";
                moreInfo.href = c.translation.moreinfo;
                moreInfo.target = "_blank";
                moreInfo.innerText = this.texts.cookiemoreinfotext;
                details.appendChild(moreInfo);
            }
            cookieList.appendChild(details);
        });
        return cookieList;
    }
    /**
     * Helper method to create the info of a single category
     * @param category The category object
     * @returns A dom element containing the category info
     */
    createFormCategory(category) {
        const button = document.createElement("button");
        button.dataset.cookieCategory = category.name;
        button.innerText = category.required || this.consentCookie.allowedCategories[category.name] ? this.texts.deny : this.texts.allow;
        button.disabled = category.required;
        button.dataset.toggleState = category.required || this.consentCookie.allowedCategories[category.name] ? "deny" : "allow";
        button.className = "cookie-consent-form_category_button";
        button.onclick = () => this.onCategoryButtonChange(button);
        const label = document.createElement("h3");
        label.className = "cookie-consent-form_category_label";
        label.textContent = category.translation.displayname;
        const summary = document.createElement("summary");
        summary.appendChild(label);
        summary.appendChild(button);
        const details = document.createElement("details");
        details.className = "cookie-consent-form_category";
        details.appendChild(summary);
        const description = document.createElement("p");
        description.className = "cookie-consent-form_category_description";
        description.textContent = category.translation.description;
        details.appendChild(description);
        const cookiesForCategory = this.getCookiesOfCategory(category);
        if (cookiesForCategory.length > 0) {
            details.appendChild(this.createFormCategoryCookieList(cookiesForCategory));
        }
        return details;
    }
    /**
     * Helper method to create the footer of the consent form
     * @returns A dom element containing the footer
     */
    createFormFooter() {
        const footer = document.createElement("div");
        footer.id = "cookie-consent-form_footer";
        const closeButton = document.createElement("button");
        closeButton.id = "cookie-consent-form_buttons_close";
        closeButton.className = "cookie-consent-form_button";
        closeButton.innerText = this.texts.dismiss;
        closeButton.onclick = () => this.closeConsentForm();
        footer.appendChild(closeButton);
        return footer;
    }
    /**
     * Event method for the category button
     * @param button The button that was clicked
     */
    onCategoryButtonChange(button) {
        const category = this.getCategoryByName(button.dataset.cookieCategory);
        if (category) {
            if (!category.isAllowed) {
                this.allowCategory(category);
            }
            else {
                this.denyCategory(category);
            }
        }
    }
    /**
     * Helper method to update the state of a category button
     * @param category The category that was updated
     */
    updateButtonState(category) {
        const button = document.querySelector(`.cookie-consent-form_category_button[data-cookie-category="${category.name}"]`);
        if (category.isAllowed) {
            button.innerText = this.texts.deny;
            button.dataset.toggleState = "deny";
        }
        else {
            button.innerText = this.texts.allow;
            button.dataset.toggleState = "allow";
        }
    }
    /**
     * Helper method to add a class to an element
     * Made to avoid using classList for better browser support
     * @param element Element to add the class to
     * @param className The class to add
     */
    addClass(element, className) {
        const classes = element.className.split(" ");
        if (classes.indexOf(className) === -1) {
            classes.push(className);
            element.className = classes.join(" ").trim();
        }
    }
    /**
    * Helper method to remove a class to an element
    * Made to avoid using classList for better browser support
    * @param element Element to remove the class from
    * @param className The class to remove
    */
    removeClass(element, className) {
        const classes = element.className.split(" ");
        const index = classes.indexOf(className);
        if (index !== -1) {
            classes.splice(index, 1);
            element.className = classes.join(" ").trim();
        }
    }
    /**
     * Method to call to close the consent form
     */
    closeConsentForm() {
        if (this.wrapper) {
            this.removeClass(this.wrapper, "cookie-consent-form_visible");
        }
        else {
            throw new Error("Cookie consent form not found");
        }
    }
    /**
     * Method to call to show the consent form
     */
    showConsentForm() {
        if (this.wrapper) {
            this.wrapper.style.display = "";
            this.addClass(this.wrapper, "cookie-consent-form_visible");
        }
        else {
            throw new Error("Cookie consent form not found");
        }
    }
    /**
     * Helper method to find and enable all script tags for a category
     * @param category The category that was accepted
     */
    enableAllScriptsForCategory(category) {
        const disabledScripts = this.findDisabledScriptTagsForCategory(category);
        for (const script of disabledScripts) {
            this.enableScriptTag(script);
        }
    }
    /**
     * Helper method to find and disable all script tags for a category
     * @param category The category that was denied
     */
    disableAllScriptsForCategory(category) {
        const enabledScripts = this.findEnabledScriptTagsForCategory(category);
        for (const script of enabledScripts) {
            this.disableScriptTag(script);
        }
    }
    /**
     * Helper method to execute potential onenable function of a category
     * @param category The category that was accepted
     */
    executeOnEnable(category) {
        if (category.onenable) {
            if (this.anyWindow[category.onenable]) {
                this.anyWindow[category.onenable]();
            }
            else {
                this.logWarning(`Category ${category.name} has onenable function ${category.onenable} but it is not defined`);
            }
        }
    }
    /**
     * Helper method to execute potential ondisable function of a category
     * @param category The category that was denied
     */
    executeOnDisable(category) {
        if (category.ondisable) {
            if (this.anyWindow[category.ondisable]) {
                this.anyWindow[category.ondisable]();
            }
            else {
                this.logWarning(`Category ${category.name} has ondisable function ${category.ondisable} but it is not defined`);
            }
        }
    }
    /**
     * Helper method to remove all cookies of a category
     * @param category The category that was denied
     */
    deleteCookiesOfCategory(category) {
        if (!category.required) {
            const cookies = document.cookie.split("; ");
            const categoryCookies = this.getCookiesOfCategory(category);
            for (const cookie of cookies) {
                const cookieName = cookie.split("=")[0];
                const categoryCookie = categoryCookies.find(c => c.regex ? c.regex.test(cookieName) : c.name === cookieName);
                // Don't delete the consent cookie itself, and don't bother with httponly cookies (they can only be deleted by the server)
                if (categoryCookie && !categoryCookie.httponly && categoryCookie.name !== this.consentCookieName) {
                    this.loopThroughPathsAndDomains(cookieName);
                }
            }
        }
    }
    /**
     * Helper method to make sure the cookie is deleted.
     * Since I can't see path or domain in the cookie from javascript, it needs to go through all possible combinations, since you must target it exactly.
     * This is a bit of a hack, but it works.
     * @param cookieName The name of the cookie to delete
     */
    loopThroughPathsAndDomains(cookieName) {
        const domains = [this.fullDomain, this.topLevelDomain];
        for (const path of this.pathPermutations) {
            document.cookie = `${cookieName}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
            if (!this.cookieExists(cookieName)) {
                return;
            }
            for (const domain of domains) {
                document.cookie = `${cookieName}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain};`;
                if (!this.cookieExists(cookieName)) {
                    return;
                }
            }
        }
        this.logWarning(`Could not delete cookie with name ${cookieName}`);
    }
    /**
     * Helper method to check if a cookie exists
     * @param cookieName The name of the cookie to check
     * @returns True if the cookie exists, false otherwise
     */
    cookieExists(cookieName) {
        return document.cookie.split("; ").some(item => item.split("=")[0] === cookieName);
    }
    updateGtmConsentState(category) {
        if (this.config.enabletagmanagerconsent && category.gtmconsentstate) {
            this.logDebug(`Updating GTM consent state for ${category.name} (${category.gtmconsentstate}) to ${category.isAllowed ? "granted" : "denied"}`);
            this.anyWindow.gtag("consent", "update", { [category.gtmconsentstate]: category.isAllowed ? "granted" : "denied" });
        }
    }
    /**
     * Call to allow a single category
     * @param category The category to allow
     */
    allowCategory(category, save = true, updateButtonState = true) {
        if (category) {
            this.logDebug(`Enabling scripts for category ${category.name}`);
            this.consentCookie.allowedCategories[category.name] = true;
            category.isAllowed = true;
            this.enableAllScriptsForCategory(category);
            this.executeOnEnable(category);
            if (save) {
                this.saveToCookie();
            }
            if (updateButtonState) {
                this.updateButtonState(category);
            }
            this.updateGtmConsentState(category);
        }
        else {
            throw new Error(`Category ${category} not found`);
        }
    }
    /**
     * Call to deny a single category
     * @param category The category to deny
     */
    denyCategory(category, save = true, updateButtonState = true) {
        if (category && !category.required) {
            this.logDebug(`Disabling scripts for category ${category.name}`);
            this.consentCookie.allowedCategories[category.name] = false;
            category.isAllowed = false;
            this.disableAllScriptsForCategory(category);
            this.executeOnDisable(category);
            this.deleteCookiesOfCategory(category);
            if (save) {
                this.saveToCookie();
            }
            if (updateButtonState) {
                this.updateButtonState(category);
            }
            this.updateGtmConsentState(category);
        }
        else {
            throw new Error(`Category ${category} not found or is required`);
        }
    }
    /**
     * Call to allow all categories
     */
    allowAll() {
        for (const category of this.allCategories) {
            if (!category.required) {
                this.allowCategory(category, false);
            }
        }
        this.saveToCookie();
    }
    /**
     * Call to deny all categories (except required ones)
     */
    denyAll() {
        for (const category of this.allCategories) {
            if (!category.required) {
                this.denyCategory(category, false);
            }
        }
        this.saveToCookie();
    }
    /**
     * Helper method to generate all possible path permutations
     * Used when deleting cookies
     */
    getPathPermutations() {
        const paths = this.currentPath.split("/");
        this.pathPermutations = [];
        for (let i = 0; i < paths.length; i++) {
            let path = paths.slice(0, paths.length - i).join("/");
            if (path === "") {
                path = "/";
            }
            if (!this.pathPermutations.includes(path)) {
                this.pathPermutations.push(path);
            }
        }
    }
    /**
     * Helper method to inject the stylesheet
     */
    loadStyleSheet() {
        const styleElement = document.createElement("link");
        styleElement.setAttribute("rel", "stylesheet");
        styleElement.setAttribute("type", "text/css");
        let debounce = false;
        styleElement.onload = () => {
            if (this.config.showformoninit && this.consentCookie.firstVisit) {
                if (!debounce) {
                    if (this.config.showformoninitdelay > 0) {
                        setTimeout(() => this.showConsentForm(), this.config.showformoninitdelay);
                    }
                    else {
                        this.showConsentForm();
                    }
                    this.consentCookie.firstVisit = false;
                    debounce = true;
                }
            }
        };
        styleElement.setAttribute("href", `${this.resourcePath}/cookie-consent-form.css`);
        document.getElementsByTagName("head")[0].appendChild(styleElement);
        document.head.appendChild(styleElement);
    }
    initGoogleTagManager() {
        if (this.config.enabletagmanagerconsent) {
            this.waitForGtag();
            const payload = Object.values(GtmConsentStateType).map(k => {
                return { [k]: GtmConsentState.denied };
            });
            console.log("payload", payload);
            this.anyWindow.gtag("consent", "default", payload);
        }
    }
    /**
     * Initialize the coookie consent tracker
     */
    async init() {
        try {
            if (this.anyWindow.preventCookieConsent === true) {
                this.logWarning("Cookie consent prevented by global variable");
                return;
            }
            if (this.anyWindow.overridePath !== undefined) {
                this.resourcePath = this.anyWindow.overridePath;
            }
            this.config = await fetch(`${this.resourcePathConfigs}/config.json`).then(response => response.json());
            if (this.config.preventonpaths && this.config.preventonpaths.length > 0 && this.config.preventonpaths.find(p => window.location.pathname.startsWith(p))) {
                this.logWarning("Cookie consent prevented on this path");
                return;
            }
            this.getPathPermutations();
            this.allCategories = await fetch(`${this.resourcePathConfigs}/categories.json`).then(response => response.json());
            this.initGoogleTagManager();
            const cookieData = await fetch(`${this.resourcePathConfigs}/cookies.json`).then(response => response.json());
            this.allCookies = cookieData.map((cd) => new CookieData(cd.name, cd.category, cd.httponly, cd.regex));
            await this.loadTranslations();
            this.loadFromCookie();
            this.createConsentForm();
            this.loadStyleSheet();
        }
        catch (e) {
            this.logError("Failed to initialize cookie consent", e);
        }
    }
    waitForGtag(nrOfWaits = 0) {
        if (typeof this.anyWindow.gtag !== "undefined") {
            return;
        }
        else if (nrOfWaits > 20) {
            throw new Error("Could not find gtag function, either disable tag manager integration or make sure gtag is loaded");
        }
        else {
            setTimeout(() => { this.waitForGtag(nrOfWaits++); }, 250);
        }
    }
}
window.onload = async () => {
    const cookieConsent = new CookieConsent();
    window.cookieConsent = cookieConsent;
    await cookieConsent.init();
};
//# sourceMappingURL=cookie-consent.js.map