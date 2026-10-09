const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const WIDTHS = [
  { name: '1_desktop_1920', width: 1920, height: 1080 },
  { name: '2_laptop_1440', width: 1440, height: 900 },
  { name: '3_desktop_1280', width: 1280, height: 800 },
  { name: '4_tablet_landscape_1024', width: 1024, height: 768 },
  { name: '5_tablet_portrait_768', width: 768, height: 1024 },
  { name: '6_mobile_375', width: 375, height: 667 },
];

async function captureScreenshots() {
  console.log('🚀 Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // 1. Visit login page
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle0' });

    // 2. Set token and user in localStorage
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock_verified_token');
      localStorage.setItem('user', JSON.stringify({
        id: 'mock_admin_id',
        name: 'Keerti Class Admin',
        email: 'admin@k001.com',
        role: 'admin'
      }));
    });

    // 3. Navigate directly to /dashboard
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    console.log('Navigated to:', page.url());

    for (const item of WIDTHS) {
      console.log(`📸 Capturing Dashboard width: ${item.width}px (${item.name})...`);
      await page.setViewport({
        width: item.width,
        height: item.height,
        deviceScaleFactor: 1
      });

      await new Promise(r => setTimeout(r, 1000));
      const screenshotPath = path.join(OUTPUT_DIR, `dashboard_${item.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`✅ Saved: ${screenshotPath}`);
    }

    console.log('🎉 Dashboard screenshots captured across all 6 viewports!');
  } catch (err) {
    console.error('❌ Error during capture:', err);
  } finally {
    await browser.close();
  }
}

captureScreenshots();
