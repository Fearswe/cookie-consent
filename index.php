<?php
// Path: cookie-consent.php
setcookie('session', 'test', time() + 3600, '/');
setcookie('marketing-cookie', 'test', time() + 3600, '/consent', "", true);
?>

<!doctype html>
<html lang="en">

<head>
    <title>Cookie Consent Test</title>
    <!-- Google tag (gtag.js) -->
    <noscript data-cookie-category="analytics" async src="https://www.googletagmanager.com/gtag/js?id=G-JVSNGQ2BSW"></noscript>
    <noscript data-cookie-category="analytics">
        window.dataLayer = window.dataLayer || [];
        function gtag() { dataLayer.push(arguments); }
        gtag('js', new Date());

        gtag('config', 'G-JVSNGQ2BSW');
    </noscript>
    
    <script>
        window.onMarketingDisabled = async () => {
            await fetch('backendcall.php?action=delete');
        }
        window.onMarketingEnabled = async () => {
            await fetch('backendcall.php?action=set');
        }
    </script>

    <script src="dist/cookie-consent/cookie-consent.js"></script>
</head>

<body>
    <h1>Cookie Consent Test</h1>
    <p>I'm just a page to test the cookie consent script.</p>
    <button onclick="cookieConsent.showConsentForm()">Click to open consent form</button>
</body>

</html>

