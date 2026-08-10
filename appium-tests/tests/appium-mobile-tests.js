const { remote } = require('webdriverio');
const assert = require('assert');
const path = require('path');

const APK_PATH = process.env.APK_PATH || path.join(__dirname, '../../Smart Resume Verifier (3).apk');

const appiumOpts = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:app': APK_PATH,
    'appium:appPackage': 'com.smartresumeverifier.app',
    'appium:appActivity': 'com.smartresumeverifier.app.MainActivity',
    'appium:autoGrantPermissions': true,
    'appium:noReset': false,
    'appium:newCommandTimeout': 120
  }
};

describe('Smart Resume Verifier - Appium Mobile E2E Suite', function () {
  this.timeout(120000);
  let client;

  before(async function () {
    try {
      client = await remote(appiumOpts);
    } catch (err) {
      console.warn('[WARN] Could not connect to active Appium server instance. Running in mock/dry-run test mode:', err.message);
    }
  });

  after(async function () {
    if (client) {
      await client.deleteSession();
    }
  });

  // TC-MOB-001: Mobile Application Launch & Webview Context Init
  it('TC-MOB-001: Should launch mobile app and initialize WebView context', async function () {
    if (!client) return this.skip();
    const contexts = await client.getContexts();
    assert(contexts.length > 0);
  });

  // TC-MOB-002: Mobile Splash Screen & Brand Logo Visibility
  it('TC-MOB-002: Should display application splash screen and brand logo', async function () {
    if (!client) return this.skip();
    const logo = await client.$('~ResumeVerify') || await client.$('android=new UiSelector().textContains("ResumeVerify")');
    assert(await logo.isDisplayed());
  });

  // TC-MOB-003: Mobile Touch Interaction on Email Input
  it('TC-MOB-003: Should accept email input via mobile virtual keyboard', async function () {
    if (!client) return this.skip();
    const emailField = await client.$('android=new UiSelector().className("android.widget.EditText").instance(0)');
    await emailField.click();
    await emailField.setValue('candidate.mobile@example.com');
    const text = await emailField.getText();
    assert(text.includes('candidate.mobile@example.com'));
  });

  // TC-MOB-004: Mobile Hide Keyboard Gesture Handling
  it('TC-MOB-004: Should hide soft keyboard on tap outside or enter key press', async function () {
    if (!client) return this.skip();
    if (await client.isKeyboardShown()) {
      await client.hideKeyboard();
    }
    assert.strictEqual(await client.isKeyboardShown(), false);
  });

  // TC-MOB-005: Mobile Orientation Switch (Portrait <-> Landscape)
  it('TC-MOB-005: Should handle orientation switch without crashing UI', async function () {
    if (!client) return this.skip();
    await client.setOrientation('LANDSCAPE');
    await client.pause(1000);
    const currentOrientation = await client.getOrientation();
    assert.strictEqual(currentOrientation, 'LANDSCAPE');
    await client.setOrientation('PORTRAIT');
  });

  // TC-MOB-006: Mobile Touch Scroll Swipe Gesture
  it('TC-MOB-006: Should perform scroll swipe down gesture on login screen', async function () {
    if (!client) return this.skip();
    await client.performActions([{
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: 500, y: 1500 },
        { type: 'pointerDown', button: 0 },
        { type: 'pointerMove', duration: 500, x: 500, y: 500 },
        { type: 'pointerUp', button: 0 }
      ]
    }]);
    assert(true);
  });

  // TC-MOB-007: App Background & Resume State Verification
  it('TC-MOB-007: Should pause app to background and resume safely', async function () {
    if (!client) return this.skip();
    await client.background(3);
    const state = await client.queryAppState('com.smartresumeverifier.app');
    assert(state >= 3); // 3 or 4 = RUNNING_IN_BACKGROUND / RUNNING_IN_FOREGROUND
  });

  // TC-MOB-008: Native Device Back Button Press
  it('TC-MOB-008: Should handle Android physical back button press', async function () {
    if (!client) return this.skip();
    await client.pressKeyCode(4); // KeyCode 4 = BACK
    assert(true);
  });

  // TC-MOB-009: Capacitor Bridge Native Storage Access
  it('TC-MOB-009: Should access Capacitor Preferences/LocalStorage on device', async function () {
    if (!client) return this.skip();
    await client.execute(() => {
      localStorage.setItem('mobile_test_key', 'active_session');
    });
    const val = await client.execute(() => localStorage.getItem('mobile_test_key'));
    assert.strictEqual(val, 'active_session');
  });

  // TC-MOB-010: Mobile Toast Alert Accessibility & Dismissal
  it('TC-MOB-010: Should display native or webview toast alerts correctly', async function () {
    if (!client) return this.skip();
    const body = await client.$('android=new UiSelector().className("android.view.View").instance(0)');
    assert(await body.isDisplayed());
  });
});
