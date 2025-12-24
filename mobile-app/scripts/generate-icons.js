const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');
const svgPath = path.join(assetsDir, 'icon.svg');

async function generateIcons() {
  const svgBuffer = fs.readFileSync(svgPath);

  // iOS App Icon (1024x1024)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));
  console.log('Generated icon.png (1024x1024)');

  // Android Adaptive Icon Foreground (1024x1024)
  await sharp(svgBuffer)
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'adaptive-icon.png'));
  console.log('Generated adaptive-icon.png (1024x1024)');

  // Splash icon (larger for splash screen)
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));
  console.log('Generated splash-icon.png (512x512)');

  // Favicon (48x48)
  await sharp(svgBuffer)
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));
  console.log('Generated favicon.png (48x48)');

  // Notification icon (96x96, white on transparent for Android)
  // For notification icons, we need a simpler monochrome version
  // Using the same icon for now
  await sharp(svgBuffer)
    .resize(96, 96)
    .png()
    .toFile(path.join(assetsDir, 'notification-icon.png'));
  console.log('Generated notification-icon.png (96x96)');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
