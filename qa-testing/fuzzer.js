const { Builder, By, until, Key } = require('selenium-webdriver');

async function randomFuzzTest() {
    console.log("🚀 Starting Advanced UI Fuzzing Engine (Clicks + Text Injection)...");
    let driver;
    try {
        driver = await new Builder().forBrowser('chrome').build();
        console.log("Browser launched successfully. Navigating to localhost:3000...");
        
        await driver.get('http://localhost:3000/candidate/practice/coding/python/');
        await driver.sleep(2000);

        const MAX_ACTIONS = 10000; // Continuous fuzzing
        let clickCount = 0;
        let typeCount = 0;

        for (let i = 0; i < MAX_ACTIONS; i++) {
            try {
                // Find all interactable elements (buttons, links, inputs, textareas)
                const interactables = await driver.findElements(By.css('button, a, input, textarea, [role="button"], .monaco-editor'));
                
                if (interactables.length === 0) {
                    console.log("⚠️ No interactable elements found on this page.");
                    break;
                }

                // Pick a random element
                const randomElement = interactables[Math.floor(Math.random() * interactables.length)];
                
                // Ensure it is displayed and enabled
                const isDisplayed = await randomElement.isDisplayed();
                const isEnabled = await randomElement.isEnabled();

                if (isDisplayed && isEnabled) {
                    const tag = await randomElement.getTagName();
                    const text = await randomElement.getText();
                    const type = await randomElement.getAttribute('type');
                    
                    if (tag === 'input' || tag === 'textarea') {
                        // Fuzzing Inputs
                        const randomText = Math.random().toString(36).substring(2, 10);
                        console.log(`[Fuzzer] Injecting text "${randomText}" into ${tag} (type: ${type})...`);
                        await randomElement.sendKeys(randomText);
                        typeCount++;
                    } else {
                        // Fuzzing Clicks
                        console.log(`[Fuzzer] Clicking ${tag} element... Text: "${text.substring(0, 30)}"`);
                        await driver.executeScript("arguments[0].click();", randomElement);
                        clickCount++;
                    }
                    
                    // Wait a bit to let any state changes happen
                    await driver.sleep(500);
                }
            } catch (err) {
                // Ignore stale element reference errors
                if (!err.message.includes('stale') && !err.message.includes('not interactable')) {
                    console.log(`[Error] Failed to interact: ${err.message.substring(0, 80)}`);
                }
            }
        }
        
        console.log(`\n✅ Fuzzing Complete! Performed ${clickCount} random clicks and ${typeCount} text injections without crashing the browser.`);
    } catch (e) {
        console.error("Critical Failure in Fuzzer:", e);
    } finally {
        if (driver) {
            await driver.quit();
            console.log("Browser closed.");
        }
    }
}

randomFuzzTest();
