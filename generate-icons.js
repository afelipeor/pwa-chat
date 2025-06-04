const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Create directories
const iconsDir = path.join(__dirname, 'public', 'icons');
const screenshotsDir = path.join(__dirname, 'public', 'screenshots');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Chat bubble icon SVG template
const createChatIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="2" dy="4" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>

  <!-- Background circle -->
  <circle cx="${size / 2}" cy="${size / 2}" r="${
  size / 2 - size / 16
}" fill="url(#grad)" filter="url(#shadow)"/>

  <!-- Main chat bubble -->
  <path d="M ${size * 0.2} ${size * 0.3}
           Q ${size * 0.2} ${size * 0.25} ${size * 0.25} ${size * 0.25}
           L ${size * 0.7} ${size * 0.25}
           Q ${size * 0.75} ${size * 0.25} ${size * 0.75} ${size * 0.3}
           L ${size * 0.75} ${size * 0.55}
           Q ${size * 0.75} ${size * 0.6} ${size * 0.7} ${size * 0.6}
           L ${size * 0.45} ${size * 0.6}
           L ${size * 0.35} ${size * 0.7}
           L ${size * 0.4} ${size * 0.6}
           L ${size * 0.25} ${size * 0.6}
           Q ${size * 0.2} ${size * 0.6} ${size * 0.2} ${size * 0.55}
           Z"
        fill="white" opacity="0.95"/>

  <!-- Chat dots -->
  <circle cx="${size * 0.35}" cy="${size * 0.425}" r="${
  size * 0.025
}" fill="#667eea"/>
  <circle cx="${size * 0.475}" cy="${size * 0.425}" r="${
  size * 0.025
}" fill="#667eea"/>
  <circle cx="${size * 0.6}" cy="${size * 0.425}" r="${
  size * 0.025
}" fill="#667eea"/>

  <!-- Small notification dot -->
  <circle cx="${size * 0.7}" cy="${size * 0.3}" r="${
  size * 0.08
}" fill="#ff4757"/>
  <circle cx="${size * 0.7}" cy="${size * 0.3}" r="${
  size * 0.05
}" fill="white"/>
</svg>`;

// Alternative modern chat icon
const createModernChatIconSVG = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="modernGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#764ba2;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#f093fb;stop-opacity:1" />
    </linearGradient>
    <filter id="modernShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(102,126,234,0.4)"/>
    </filter>
  </defs>

  <!-- Background with rounded square -->
  <rect x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${
  size * 0.8
}"
        rx="${size * 0.15}" ry="${
  size * 0.15
}" fill="url(#modernGrad)" filter="url(#modernShadow)"/>

  <!-- Main chat bubble -->
  <rect x="${size * 0.25}" y="${size * 0.3}" width="${size * 0.45}" height="${
  size * 0.25
}"
        rx="${size * 0.08}" ry="${size * 0.08}" fill="white" opacity="0.9"/>

  <!-- Chat lines -->
  <rect x="${size * 0.3}" y="${size * 0.38}" width="${size * 0.25}" height="${
  size * 0.03
}"
        rx="${size * 0.015}" fill="#667eea" opacity="0.7"/>
  <rect x="${size * 0.3}" y="${size * 0.45}" width="${size * 0.35}" height="${
  size * 0.03
}"
        rx="${size * 0.015}" fill="#667eea" opacity="0.5"/>

  <!-- Second chat bubble -->
  <rect x="${size * 0.35}" y="${size * 0.58}" width="${size * 0.4}" height="${
  size * 0.2
}"
        rx="${size * 0.06}" ry="${size * 0.06}" fill="white" opacity="0.85"/>

  <!-- Second chat lines -->
  <rect x="${size * 0.4}" y="${size * 0.63}" width="${size * 0.2}" height="${
  size * 0.025
}"
        rx="${size * 0.01}" fill="#764ba2" opacity="0.7"/>
  <rect x="${size * 0.4}" y="${size * 0.68}" width="${size * 0.3}" height="${
  size * 0.025
}"
        rx="${size * 0.01}" fill="#764ba2" opacity="0.5"/>

  <!-- Online indicator -->
  <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${
  size * 0.06
}" fill="#2ed573"/>
  <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${
  size * 0.035
}" fill="white"/>
</svg>`;

// Convert SVG to PNG using Sharp
async function svgToPng(svgContent, outputPath, size) {
  try {
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png({
        quality: 100,
        compressionLevel: 6,
        adaptiveFiltering: true,
      })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`Error converting ${outputPath}:`, error);
    return false;
  }
}

// Create favicon ICO
async function createFavicon(svgContent) {
  try {
    // Create 32x32 PNG first
    const png32 = await sharp(Buffer.from(svgContent))
      .resize(32, 32)
      .png()
      .toBuffer();

    // Save as favicon.ico (simplified - just save as PNG for now)
    await sharp(png32).toFile(path.join(__dirname, 'public', 'favicon.ico'));

    // Also create standard favicon.png
    await sharp(png32).toFile(path.join(__dirname, 'public', 'favicon.png'));

    console.log('✅ Favicon created');
  } catch (error) {
    console.error('Error creating favicon:', error);
  }
}

// Create Apple touch icons
async function createAppleIcons(svgContent) {
  const appleSizes = [
    { size: 57, name: 'apple-touch-icon-57x57.png' },
    { size: 60, name: 'apple-touch-icon-60x60.png' },
    { size: 72, name: 'apple-touch-icon-72x72.png' },
    { size: 76, name: 'apple-touch-icon-76x76.png' },
    { size: 114, name: 'apple-touch-icon-114x114.png' },
    { size: 120, name: 'apple-touch-icon-120x120.png' },
    { size: 144, name: 'apple-touch-icon-144x144.png' },
    { size: 152, name: 'apple-touch-icon-152x152.png' },
    { size: 180, name: 'apple-touch-icon-180x180.png' },
  ];

  for (const icon of appleSizes) {
    const outputPath = path.join(iconsDir, icon.name);
    await svgToPng(svgContent, outputPath, icon.size);
  }

  console.log('✅ Apple touch icons created');
}

// Create screenshot for PWA manifest
async function createScreenshot() {
  const screenshotSVG = `
<svg width="540" height="720" viewBox="0 0 540 720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="540" height="720" fill="url(#bgGrad)"/>

  <!-- Phone mockup -->
  <rect x="70" y="100" width="400" height="520" rx="30" fill="white" opacity="0.95"/>

  <!-- Header -->
  <rect x="90" y="120" width="360" height="60" rx="15" fill="#667eea"/>
  <text x="270" y="155" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">Chat App</text>

  <!-- Chat messages -->
  <rect x="110" y="200" width="200" height="40" rx="20" fill="#e1e8ed"/>
  <rect x="230" y="260" width="180" height="40" rx="20" fill="#667eea"/>
  <rect x="110" y="320" width="160" height="40" rx="20" fill="#e1e8ed"/>
  <rect x="250" y="380" width="140" height="40" rx="20" fill="#667eea"/>

  <!-- Input area -->
  <rect x="90" y="540" width="360" height="50" rx="25" fill="#f8f9fa" stroke="#e1e8ed" stroke-width="2"/>

  <!-- App title -->
  <text x="270" y="680" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="36" font-weight="bold">Mobile Chat PWA</text>
</svg>`;

  try {
    await sharp(Buffer.from(screenshotSVG))
      .resize(540, 720)
      .png()
      .toFile(path.join(screenshotsDir, 'mobile-1.png'));

    console.log('✅ App screenshot created');
  } catch (error) {
    console.error('Error creating screenshot:', error);
  }
}

// Main generation function
async function generateAllIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Icon sizes for PWA manifest
  const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

  // Choose icon style (you can change this)
  const useModernStyle = true;
  const svgContent = useModernStyle
    ? createModernChatIconSVG(512)
    : createChatIconSVG(512);

  // Save master SVG
  fs.writeFileSync(path.join(iconsDir, 'icon-master.svg'), svgContent);
  console.log('✅ Master SVG created');

  // Generate all PWA icon sizes
  let successCount = 0;
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    const success = await svgToPng(svgContent, outputPath, size);
    if (success) {
      successCount++;
      console.log(`✅ Generated ${size}x${size} icon`);
    }
  }

  // Create favicon
  await createFavicon(svgContent);

  // Create Apple touch icons
  await createAppleIcons(svgContent);

  // Create app screenshot
  await createScreenshot();

  console.log(`\n🎉 Icon generation complete!`);
  console.log(`📊 Generated ${successCount}/${sizes.length} PWA icons`);
  console.log(`📁 Icons saved to: ${iconsDir}`);
  console.log(`📱 Screenshots saved to: ${screenshotsDir}`);

  // Verify files
  console.log('\n📋 Generated files:');
  const iconFiles = fs.readdirSync(iconsDir);
  iconFiles.forEach((file) => {
    const filePath = path.join(iconsDir, file);
    const stats = fs.statSync(filePath);
    console.log(`   ${file} (${Math.round(stats.size / 1024)}KB)`);
  });
}

// Run if called directly
if (require.main === module) {
  generateAllIcons().catch(console.error);
}

module.exports = { generateAllIcons };
