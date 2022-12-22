# Cookie consent tracker

This is a simple client-side cookie consent tracker.

## Features
* Translatable
* Customizable
* No dependencies
* Vanilla JS
* Toggles scripts when consent is updated
* Deletes cookies when consent is revoked
* Execute custom functions when consent is updated
* Allows to flag a category as mandatory, which will still show information but not allow the user to revoke consent

## Usage
1. Include the script in your HTML
2. Make sure the lang attribute is set on the html tag, or rely on the fallback language
3. Add the data-cookie-category attribute to the scripts you want to toggle
4. Optionally customize the general settings in `configs/config.js`
5. Add your categories to `configs/categories.js`
6. Add your cookies to `configs/cookies.js`
7. Add your translations to `configs/translations.js`
8. Add a button or link that executes the following function: `cookieConsent.showConsentForm();` on click to allow users to change their consent

For best result, all scripts you wan to toggle should be added as a noscript tag instead of a normal script tag.
It will still disable normal script tags, but since the script is loaded before it is disabled, it will still be executed and thus the user will be tracked. So for best result, use noscript tags and let this script enable them when consent is given.

For example:
```html	
<noscript data-cookie-category="analytics" async src="https://www.googletagmanager.com/gtag/js?id=ID-HERE"></noscript>
<noscript data-cookie-category="marketing">
    console.log("This will only be executed when consent is given for the marketing category");
</noscript>
```

## Customization
There's multiple things you can customize to fit your needs.

### Overrides
You can override the default location of the configs by adding following variable to the global scope before including the script:
```javascript
window.overridePath = "/path/to/configs";
```
You can disable the consent from running on a page with the following variable:
```javascript
window.preventCookieConsent = true;
```


### General settings
You can customize the following settings in configs/config.js:
* fallbacklanguage: The language to use if the lang attribute is not set on the html tag. Defaults to "en"
* showformoninit: Whether to show the consent form on page load if no consent has been given prior. Defaults to true.
* showformoninitdelay: Delay in milliseconds before showing the consent form on page load, if showformoninit is true. Defaults to 0
* parentelement: The element to append the consent form to. Defaults to "body"
* preventonpaths: An array of paths to prevent the consent form from showing on. Keep in mind all sub paths will also be excluded. Defaults to empty.
Example:
```json
{
    "fallbacklanguage": "en",
    "showformoninit": true,
    "showformoninitdelay": 0,
    "parentelement": "body",
    "preventonpaths": [
        "/excluded"
    ]
}
```

### Categories
This is where you define your different categories. A category must have the following properties:

* name: The name of the category. This is used to identify the category and should be unique. This is required. Example: `analytics`
* required: Whether the category is required. If true, the user will not be able to revoke consent for this category.
* onenable: The name of the function to execute when consent is given for this category. This is optional, remove if not needed. Defaults to null. Make sure the function is defined in the global scope.
* ondisable: The name of the function to execute when consent is revoked for this category. This is optional, remove if not needed. Defaults to null. Make sure the function is defined in the global scope.

For example:
```json
[
    {
        "name": "mandatory",
        "required": true
    },
    {
        "name": "analytics",
        "required": false,
        "onenable": "enable_analytics",
        "ondisable": "disable_analytics"
    },
    {
        "name": "marketing",
        "required": false     
    }
]
```	

### Cookies
This is where you define your different cookies. A cookie must have the following properties:

* name: The name of the cookie. This is used to identify the cookie and should be unique. This is required. Example: `_ga`
* category: The name of the category this cookie belongs to. This is required and must match a category listed in the categories config. Example: `analytics`
* httponly: Whether the cookie is http only. If true, the script will not bother trying to remove it. This is optional, remove if not needed. Defaults to false. 
* regex: A regex to match the cookie name against. This is optional, remove if not needed. Defaults to null. If this is set, the regex string will be used to find the name of the cookie instead. Useful for when you can't know the exact name of the cookie beforehand.

For example:
```json
[
    {
        "name": "session",
        "category": "mandatory",
        "httponly": true
    },
    {
        "name": "cookie-consent",
        "category": "mandatory",
        "httponly": false
    },
    {
        "name": "_ga",
        "category": "analytics",
        "httponly": false
    },
    {
        "name": "_ga_ID",
        "category": "analytics",
        "httponly": false,
        "regex": "_ga_.*"
    },
    {
        "name": "some-marketing-cookie",
        "category": "marketing",
        "httponly": false
    }
]
```

### Translations
This is where you define your translations. The name of the file must match the lang attribute in the html tag. For example `sv-se.json`.
Make sure you have at the very least a file for the specified fallback language.

A translation must have the following properties:
#### General
* title: The title of the consent form. For example "Cookie Consent"
* description: The description of the consent form. For example "This website uses cookies to ensure you get the best experience on our website."
* policylink: The link to your cookie policy. Optional. For example `https://www.example.com/cookie-policy`
* policylinktext: The text to display for the cookie policy link. Optional. For example `Cookie Policy`
* dismiss: The text to display for the dismiss button. For example `Dismiss`
* allowall: The text to display for the allow all button. For example `Allow all`
* denyall: The text to display for the deny all button. For example `Deny all`
* allow: The text to display for the allow button. For example `Allow`
* deny: The text to display for the deny button. For example `Deny`
* cookies: The text to display for the cookies header. For example `Cookies in category`
* cookiemoreinfotext: The text to display for the more info link on a cookie. For example `More info`

#### Categories
* name: The name of the category. For example `analytics`. Must match the name of a category in the categories config.
* displayname: The display name of the category. For example `Analytics`, this is what will be displayed to the user.
* description: The description of the category. For example `Cookies used to track visitors across websites.`

#### Cookies
* name: The name of the cookie. For example `_ga`. Must match the name of a cookie in the cookies config.
* description: The description of the cookie. For example `Used to distinguish users.`
* moreinfo: The link to more info about the cookie. Optional. For example `https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage`

For example:
```json
{
    "title": "Cookie Consent",
    "description": "This website uses cookies to ensure you get the best experience on our website.",
    "policylink": "https://www.example.com/cookie-policy",
    "policylinktext": "Cookie Policy",
    "dismiss": "Dismiss",
    "allowall": "Allow all",
    "denyall": "Deny all",
    "allow": "Allow",
    "deny": "Deny",
    "cookies": "Cookies in category",
    "cookiemoreinfotext": "More info",
    "categories": [
        {
            "name": "mandatory",
            "displayname": "Mandatory",
            "description": "Cookies that are required for the website to function."
        },
        {
            "name": "analytics",
            "displayname": "Analytics",
            "description": "Cookies used to track visitors across websites."
        },
        {
            "name": "marketing",
            "displayname": "Marketing",
            "description": "Cookies used to track visitors across websites."
        }
    ],
    "cookies": [
        {
            "name": "session",
            "description": "Used to keep track of your session.",
        },
        {
            "name": "cookie-consent",
            "description": "Used to keep track of your cookie consent.",
        },
        {
            "name": "_ga",
            "description": "Used to distinguish users.",
            "moreinfo": "https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage"
        },
        {
            "name": "_ga_ID",
            "description": "Used to distinguish users.",
            "moreinfo": "https://developers.google.com/analytics/devguides/collection/analyticsjs/cookie-usage"
        },
        {
            "name": "some-marketing-cookie",
            "description": "Used to track visitors across websites.",
            "moreinfo": "https://www.example.com/some-marketing-cookie"
        }
    ]
}
```