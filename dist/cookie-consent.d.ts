declare class CookieCategory {
    name: string;
    required: boolean;
    onenable: string;
    ondisable: string;
    isAllowed: boolean;
    translation: {
        displayname: string;
        description: string;
    };
}
declare class CookieData {
    name: string;
    category: string;
    httponly: boolean;
    translation: {
        name: string;
        description: string;
        moreinfo?: string;
    };
}
declare class ConsentCookie {
    allowedCategories: {
        [key: string]: boolean;
    };
}
declare class ConsentConfig {
    fallbacklanguage: string;
    showformoninit: boolean;
    showformoninitdelay: number;
    parentelement: string;
    preventonpaths: string[];
}
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
}
declare class CookieConsent {
    consentCookie: ConsentCookie;
    allCategories: CookieCategory[];
    allCookies: CookieData[];
    config: ConsentConfig;
    texts: GeneralConsentTexts;
    isOpen: boolean;
    private wrapper;
    constructor();
    private getCategoryByName;
    private getCookieByName;
    private getCookiesOfCategory;
    private disableScriptTag;
    private createElement;
    private enableScriptTag;
    private findEnabledScriptTagsForCategory;
    private findDisabledScriptTagsForCategory;
    private loadFromCookie;
    private saveToCookie;
    private loadTranslations;
    private createConsentForm;
    private createButtonForCategory;
    onCategoryButtonChange(button: HTMLButtonElement): void;
    private updateButtonState;
    closeConsentForm(): void;
    showConsentForm(): void;
    private enableAllScriptsForCategory;
    private disableAllScriptsForCategory;
    private executeOnEnable;
    private executeOnDisable;
    private deleteCookiesOfCategory;
    acceptCategory(category: CookieCategory): void;
    declineCategory(category: CookieCategory): void;
    acceptAll(): void;
    declineAll(): void;
    init(): Promise<void>;
}
