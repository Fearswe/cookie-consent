class CookieCategory {
    name: string = "";
    required: boolean = false;
    onenable: string = "";
    ondisable: string = "";
    isAllowed: boolean = false;
    translation: {
        displayname: string,
        description: string
    } = { displayname: "", description: "" };
}

class CookieData {
    name: string = "";
    category: string = "";
    httponly: boolean = false;
    translation: {
        name: string,
        description: string,
        moreinfo?: string
    } = { name: "", description: "" };
}

class ConsentCookie {
    allowedCategories: { [key: string]: boolean } = {};
}

class ConsentConfig {
    fallbacklanguage: string = "";
    showformoninit: boolean = true;
    showformoninitdelay: number = 0;
    parentelement: string = "";
    preventonpaths: string[] = [];

}

class GeneralConsentTexts {
    title: string = "";
    description: string = "";
    policylink: string = "";
    policylinktext: string = "";
    dismiss: string = "";
    allowall: string = "";
    denyall: string = "";
    allow: string = "";
    deny: string = "";
}

class CookieConsent {
    consentCookie: ConsentCookie = new ConsentCookie();
    allCategories: CookieCategory[] = [];
    allCookies: CookieData[] = [];
    config: ConsentConfig = new ConsentConfig();
    texts: GeneralConsentTexts = new GeneralConsentTexts();
    isOpen: boolean = false;

    private wrapper: HTMLElement | null = null;

    constructor() {
    }

    private getCategoryByName(name: string): CookieCategory | undefined {
        return this.allCategories.find(c => c.name === name);
    }

    private getCookieByName(name: string): CookieData | undefined {
        return this.allCookies.find(c => c.name === name);
    }

    private getCookiesOfCategory(category: CookieCategory): CookieData[] {
        return this.allCookies.filter(c => c.category === category.name);
    }

    private disableScriptTag(scriptTag: Element) {
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

    private createElement(tag: string) {
        const range = document.createRange();
        return range.createContextualFragment(tag);
    }

    private enableScriptTag(noscriptTag: Element) {
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

    private findEnabledScriptTagsForCategory(category: CookieCategory) {
        const scripts = document.querySelectorAll(`script[data-cookie-category="${category.name}"]`);
        return Array.from(scripts);
    }

    private findDisabledScriptTagsForCategory(category: CookieCategory) {
        const scripts = document.querySelectorAll(`noscript[data-cookie-category="${category.name}"]`);
        return Array.from(scripts);
    }

    private loadFromCookie() {
        const cookie = document.cookie.split("; ").find(row => row.startsWith("cookie-consent="));
        if (cookie) {
            const cookieValue = cookie.split("=")[1];
            if (cookieValue) {
                return JSON.parse(cookieValue);
            }
        }
        return {};
    }

    private saveToCookie() {
        document.cookie = `cookie-consent=${JSON.stringify(this.consentCookie)}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT;`;
    }

    private async loadTranslations() {
        let lang = document.documentElement.lang;
        if (!lang) {
            console.warn("No language set on body tag. Using fallback language: " + this.config.fallbacklanguage);
            lang = this.config.fallbacklanguage;
        }

        const translations = await fetch(`/dist/translations/${lang}.json`).then(response => response.json());
        if (translations) {
            this.allCategories.forEach(c => {
                const translation = translations.categories.find((t: any) => t.name === c.name);
                if (translation) {
                    c.translation = translation;
                }
            });
            this.allCookies.forEach(c => {
                const translation = translations.cookies.find((t: any) => t.name === c.name);
                if (translation) {
                    c.translation = translation;
                }
            });

            this.texts = translations.general;
        }
        else {
            throw new Error("Could not load translations for language " + lang);
        }
    }

    private createConsentForm() {
        this.wrapper = document.getElementById("cookie-consent-form_wrapper");
        if (!this.wrapper) {
            this.wrapper = document.createElement("div");
            this.wrapper.id = "cookie-consent-form_wrapper";
        }
        else {
            this.wrapper.innerHTML = "";
        }

        let form = document.createElement("div");
        form.id = "cookie-consent-form";
        this.wrapper.appendChild(form);

        let header = document.createElement("div");
        header.id = "cookie-consent-form_header";

        let heading = document.createElement("h2");
        heading.id = "cookie-consent-form_heading";
        heading.innerText = this.texts.title;
        header.appendChild(heading);

        let description = document.createElement("p");
        description.id = "cookie-consent-form_description";
        description.innerText = this.texts.description;
        header.appendChild(description);

        let policyLink = document.createElement("a");
        policyLink.id = "cookie-consent-form_policylink";
        policyLink.href = this.texts.policylink;
        policyLink.target = "_blank";
        policyLink.innerText = this.texts.policylinktext;
        header.appendChild(policyLink);

        form.appendChild(header);

        let buttons = document.createElement("div");
        buttons.id = "cookie-consent-form_buttons";

        let acceptAllButton = document.createElement("button");
        acceptAllButton.id = "cookie-consent-form_buttons_acceptall";
        acceptAllButton.className = "cookie-consent-form_button";
        acceptAllButton.innerText = this.texts.allowall;
        acceptAllButton.onclick = () => {
            this.acceptAll();
            this.closeConsentForm();
        };
        buttons.appendChild(acceptAllButton);

        let declineAllButton = document.createElement("button");
        declineAllButton.id = "cookie-consent-form_buttons_declineall";
        declineAllButton.className = "cookie-consent-form_button";
        declineAllButton.innerText = this.texts.denyall;
        declineAllButton.onclick = () => {
            this.declineAll();
            this.closeConsentForm();
        };
        buttons.appendChild(declineAllButton);

        form.appendChild(buttons);

        let categories = document.createElement("div");
        categories.id = "cookie-consent-form_categories";
        this.allCategories.forEach(c => categories.appendChild(this.createButtonForCategory(c)));
        form.appendChild(categories);

        let footer = document.createElement("div");
        footer.id = "cookie-consent-form_footer";

        let closeButton = document.createElement("button");
        closeButton.id = "cookie-consent-form_buttons_close";
        closeButton.className = "cookie-consent-form_button";
        closeButton.innerText = this.texts.dismiss;
        closeButton.onclick = () => this.closeConsentForm();
        footer.appendChild(closeButton);

        form.appendChild(footer);

        const parentElement = document.querySelector(this.config.parentelement);
        if (parentElement) {
            parentElement.appendChild(this.wrapper);
        }
        else {
            throw new Error(`Parent element not found for ${this.config.parentelement}`);
        }
    }

    private createButtonForCategory(category: CookieCategory) {
        const button = document.createElement("button");
        button.dataset.cookieCategory = category.name;
        button.innerText = category.required || this.consentCookie.allowedCategories[category.name] ? this.texts.deny : this.texts.allow;
        button.disabled = category.required;
        button.dataset.toggleState = category.required || this.consentCookie.allowedCategories[category.name] ? "deny" : "allow";
        button.className = "cookie-consent-form_category_button";
        button.onclick = () => this.onCategoryButtonChange(button);

        const label = document.createElement("span");
        label.className = "cookie-consent-form_category_label";
        label.textContent = category.translation.displayname;        

        const summary = document.createElement("summary");
        summary.appendChild(label);
        summary.appendChild(button);

        const details = document.createElement("details");
        details.className = "cookie-consent-form_category";
        details.appendChild(summary);

        const description = document.createElement("span");
        description.className = "cookie-consent-form_category_description";
        description.textContent = category.translation.description;
        details.appendChild(description);        

        return details;
    }

    public onCategoryButtonChange(button: HTMLButtonElement) {
        const category = this.getCategoryByName(button.dataset.cookieCategory!);
        if (category) {
            if (!category.isAllowed) {
                this.acceptCategory(category);
            }
            else {
                this.declineCategory(category);
            }
        }
    }

    private updateButtonState(category: CookieCategory) {
        const button = document.querySelector(`.cookie-consent-form_category_button[data-cookie-category="${category.name}"]`) as HTMLButtonElement;
        if (category.isAllowed) {
            button.innerText = this.texts.deny;
            button.dataset.toggleState = "deny";
        }
        else {
            button.innerText = this.texts.allow;
            button.dataset.toggleState = "allow";
        }
    }

    public closeConsentForm() {
        if (this.wrapper) {
            this.wrapper.classList.remove("cookie-consent-form_visible");
            this.isOpen = false;
        }
        else {
            throw new Error("Cookie consent form not found");
        }
    }

    public showConsentForm() {
        if (this.wrapper) {
            this.wrapper.classList.add("cookie-consent-form_visible");
            this.isOpen = true;
        }
        else {
            throw new Error("Cookie consent form not found");
        }
    }

    private enableAllScriptsForCategory(category: CookieCategory) {
        const disabledScripts = this.findDisabledScriptTagsForCategory(category);
        for (const script of disabledScripts) {
            this.enableScriptTag(script);
        }
    }

    private disableAllScriptsForCategory(category: CookieCategory) {
        const enabledScripts = this.findEnabledScriptTagsForCategory(category);
        for (const script of enabledScripts) {
            this.disableScriptTag(script);
        }
    }

    private executeOnEnable(category: CookieCategory) {
        if (category.onenable && (window as any)[category.onenable]) {
            (window as any)[category.onenable]();
        }
    }

    private executeOnDisable(category: CookieCategory) {
        if (category.ondisable && (window as any)[category.ondisable]) {
            (window as any)[category.ondisable]();
        }
    }

    private deleteCookiesOfCategory(category: CookieCategory) {
        const cookies = document.cookie.split("; ");
        const categoryCookies = this.getCookiesOfCategory(category);
        for (const cookie of cookies) {
            const cookieName = cookie.split("=")[0];
            if (categoryCookies.find(c => c.name === cookieName)) {
                document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
            }
        }
    }

    public acceptCategory(category: CookieCategory) {
        if (category) {
            this.consentCookie.allowedCategories[category.name] = true;
            category.isAllowed = true;
            this.enableAllScriptsForCategory(category);
            this.executeOnEnable(category);
            this.saveToCookie();
            this.updateButtonState(category);
        }
        else {
            throw new Error(`Category ${category} not found`);
        }
    }

    public declineCategory(category: CookieCategory) {
        if (category && !category.required) {
            this.consentCookie.allowedCategories[category.name] = false;
            category.isAllowed = false;
            this.disableAllScriptsForCategory(category);
            this.executeOnDisable(category);
            this.deleteCookiesOfCategory(category);
            this.saveToCookie();
            this.updateButtonState(category);
        }
        else {
            throw new Error(`Category ${category} not found or is required`);
        }

    }

    public acceptAll() {
        for (const category of this.allCategories) {
            this.acceptCategory(category);
        }
    }

    public declineAll() {
        for (const category of this.allCategories) {
            if (!category.required) {
                this.declineCategory(category);
            }
        }
    }

    public async init() {
        if ((window as any).preventCookieConsent === true) {
            console.warn("Cookie consent prevented by global variable");
            return;
        }
        this.config = await fetch("/dist/configs/config.json").then(response => response.json());

        if (this.config.preventonpaths && this.config.preventonpaths.length > 0 && this.config.preventonpaths.find(p => window.location.pathname.startsWith(p))) {
            console.warn("Cookie consent prevented on this path");
            return;
        }

        this.allCategories = await fetch("/dist/configs/categories.json").then(response => response.json());
        this.allCookies = await fetch("/dist/configs/cookies.json").then(response => response.json());
        this.consentCookie = this.loadFromCookie();
        if (this.consentCookie.allowedCategories) {
            for (const category of this.allCategories) {
                if (this.consentCookie.allowedCategories[category.name] || category.required) {
                    console.info(`Enabling scripts for category ${category.name}`);
                    this.enableAllScriptsForCategory(category);
                    this.executeOnEnable(category);
                    category.isAllowed = true;
                }
                else {
                    console.info(`Disabling scripts for category ${category.name}`);
                    this.disableAllScriptsForCategory(category);
                    this.executeOnDisable(category);
                    this.deleteCookiesOfCategory(category);
                    category.isAllowed = false;
                }
            }
        }
        else {
            this.consentCookie = new ConsentCookie();
            this.consentCookie.allowedCategories = {};
            for (const category of this.allCategories) {
                if (!category.required) {
                    console.info(`Disabling scripts for category ${category.name}`);
                    this.consentCookie.allowedCategories[category.name] = false;
                    this.disableAllScriptsForCategory(category);
                    this.executeOnDisable(category);
                    this.deleteCookiesOfCategory(category);
                    category.isAllowed = false;
                }
                else {
                    console.info(`Enabling scripts for category ${category.name}`);
                    this.enableAllScriptsForCategory(category);
                    this.executeOnEnable(category);
                    category.isAllowed = true;
                }
            }
            this.saveToCookie();
        }

        await this.loadTranslations();

        this.createConsentForm();
        let styleElement = document.createElement("link");
        styleElement.setAttribute("rel", "stylesheet");
        styleElement.setAttribute("type", "text/css");

        let debounce = false;
        styleElement.onload = () => {
            if (this.config.showformoninit) {
                if (!debounce) {
                    if (this.config.showformoninitdelay > 0) {
                        setTimeout(() => this.showConsentForm(), this.config.showformoninitdelay);
                    }
                    else {
                        this.showConsentForm();
                    }
                    debounce = true;
                }
            }
        };
        styleElement.setAttribute("href", "/dist/cookie-consent-form.css");
        document.getElementsByTagName("head")[0].appendChild(styleElement);

        document.head.appendChild(styleElement);
    }

}

window.onload = async () => {
    const cookieConsent = new CookieConsent();
    (window as any).cookieConsent = cookieConsent;
    await cookieConsent.init();
};