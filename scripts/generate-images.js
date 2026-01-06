import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');

// Asegurar que el directorio public existe
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Función para crear un SVG con el logo de CompiMC
function createLogoSVG(width, height, fontSize, showText = true) {
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="#ffffff"/>
      <circle cx="${width/2}" cy="${height/2 - (showText ? 20 : 0)}" r="${Math.min(width, height) * 0.25}" fill="url(#grad)"/>
      <text x="${width/2}" y="${height/2 - (showText ? 20 : 0)}" font-family="Arial, sans-serif" font-size="${fontSize * 0.8}" font-weight="bold" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">MC</text>
      ${showText ? `<text x="${width/2}" y="${height/2 + fontSize + 20}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#1f2937" text-anchor="middle">CompiMC</text>` : ''}
      ${showText ? `<text x="${width/2}" y="${height/2 + fontSize + 50}" font-family="Arial, sans-serif" font-size="${fontSize * 0.5}" fill="#6b7280" text-anchor="middle">Simulador de Compiladores</text>` : ''}
    </svg>
  `;
}

// Función para crear SVG de Open Graph
function createOGSVG() {
  return `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#bgGrad)"/>
      <circle cx="600" cy="250" r="120" fill="#ffffff" opacity="0.2"/>
      <circle cx="600" cy="250" r="100" fill="#ffffff"/>
      <text x="600" y="250" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#6366f1" text-anchor="middle" dominant-baseline="middle">MC</text>
      <text x="600" y="410" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="#ffffff" text-anchor="middle">CompiMC</text>
      <text x="600" y="480" font-family="Arial, sans-serif" font-size="32" fill="#ffffff" text-anchor="middle" opacity="0.9">Simulador de Compiladores</text>
      <text x="600" y="550" font-family="Arial, sans-serif" font-size="24" fill="#ffffff" text-anchor="middle" opacity="0.8">Análisis Léxico • Sintáctico • Semántico</text>
    </svg>
  `;
}

// Función para crear SVG de screenshot
function createScreenshotSVG(width, height) {
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#f9fafb;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#bg)"/>
      
      <!-- Header -->
      <rect x="0" y="0" width="${width}" height="60" fill="#6366f1"/>
      <text x="20" y="38" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#ffffff">CompiMC</text>
      
      <!-- Main content -->
      <rect x="20" y="80" width="${width - 40}" height="120" fill="#ffffff" rx="8"/>
      <text x="40" y="115" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1f2937">Analizador Léxico</text>
      <text x="40" y="145" font-family="monospace" font-size="14" fill="#6b7280">Expresión regular: (a|b)*abb</text>
      <text x="40" y="175" font-family="monospace" font-size="14" fill="#10b981">✓ Cadena aceptada: aabb</text>
      
      <!-- Secondary content -->
      <rect x="20" y="220" width="${width - 40}" height="120" fill="#ffffff" rx="8"/>
      <text x="40" y="255" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1f2937">Análisis Sintáctico</text>
      <text x="40" y="285" font-family="monospace" font-size="14" fill="#6b7280">Gramática LL(1)</text>
      <text x="40" y="315" font-family="monospace" font-size="14" fill="#10b981">✓ Tabla de parsing generada</text>
      
      ${height > 500 ? `
      <!-- Third content -->
      <rect x="20" y="360" width="${width - 40}" height="120" fill="#ffffff" rx="8"/>
      <text x="40" y="395" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#1f2937">Generación de Código</text>
      <text x="40" y="425" font-family="monospace" font-size="14" fill="#6b7280">Código de tres direcciones</text>
      <text x="40" y="455" font-family="monospace" font-size="14" fill="#10b981">✓ Optimización aplicada</text>
      ` : ''}
      
      <!-- Footer -->
      <text x="${width/2}" y="${height - 30}" font-family="Arial, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">Herramienta Educativa Interactiva</text>
    </svg>
  `;
}

async function generateImages() {
  console.log('🎨 Generando imágenes...\n');

  try {
    // 1. Favicon (icono pequeño)
    console.log('📱 Generando favicon.ico...');
    const faviconSVG = createLogoSVG(64, 64, 16, false);
    await sharp(Buffer.from(faviconSVG))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.png'));
    console.log('✅ favicon.png creado\n');

    // 2. Icon 192x192 (PWA)
    console.log('📱 Generando icon-192.png...');
    const icon192SVG = createLogoSVG(192, 192, 32, false);
    await sharp(Buffer.from(icon192SVG))
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('✅ icon-192.png creado\n');

    // 3. Icon 512x512 (PWA)
    console.log('📱 Generando icon-512.png...');
    const icon512SVG = createLogoSVG(512, 512, 80, false);
    await sharp(Buffer.from(icon512SVG))
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('✅ icon-512.png creado\n');

    // 4. Apple Icon 180x180
    console.log('🍎 Generando apple-icon.png...');
    const appleIconSVG = createLogoSVG(180, 180, 28, false);
    await sharp(Buffer.from(appleIconSVG))
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-icon.png'));
    console.log('✅ apple-icon.png creado\n');

    // 5. Open Graph Image 1200x630
    console.log('🖼️  Generando og-image.png...');
    const ogSVG = createOGSVG();
    await sharp(Buffer.from(ogSVG))
      .resize(1200, 630)
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    console.log('✅ og-image.png creado\n');

    // 6. Screenshot Wide 1280x720
    console.log('📸 Generando screenshot-wide.png...');
    const screenshotWideSVG = createScreenshotSVG(1280, 720);
    await sharp(Buffer.from(screenshotWideSVG))
      .resize(1280, 720)
      .png()
      .toFile(path.join(publicDir, 'screenshot-wide.png'));
    console.log('✅ screenshot-wide.png creado\n');

    // 7. Screenshot Narrow 750x1334
    console.log('📸 Generando screenshot-narrow.png...');
    const screenshotNarrowSVG = createScreenshotSVG(750, 1334);
    await sharp(Buffer.from(screenshotNarrowSVG))
      .resize(750, 1334)
      .png()
      .toFile(path.join(publicDir, 'screenshot-narrow.png'));
    console.log('✅ screenshot-narrow.png creado\n');

    console.log('🎉 ¡Todas las imágenes se han generado exitosamente!\n');
    console.log('📂 Ubicación: /public/\n');
    console.log('Imágenes generadas:');
    console.log('  - favicon.png (32x32)');
    console.log('  - icon-192.png (192x192)');
    console.log('  - icon-512.png (512x512)');
    console.log('  - apple-icon.png (180x180)');
    console.log('  - og-image.png (1200x630)');
    console.log('  - screenshot-wide.png (1280x720)');
    console.log('  - screenshot-narrow.png (750x1334)');

  } catch (error) {
    console.error('❌ Error generando imágenes:', error);
    process.exit(1);
  }
}

generateImages();
