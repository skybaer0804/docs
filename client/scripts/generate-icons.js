import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const svgContent = readFileSync(join(process.cwd(), 'public', 'assets', 'icon.svg'), 'utf-8');

// SVG를 다양한 크기로 생성
const sizes = [
    { name: 'favicon-16x16.svg', size: 16 },
    { name: 'favicon-32x32.svg', size: 32 },
    { name: 'favicon-48x48.svg', size: 48 },
    { name: 'icon-192x192.svg', size: 192 },
    { name: 'icon-512x512.svg', size: 512 },
    { name: 'apple-touch-icon.svg', size: 180 },
];

sizes.forEach(({ name, size }) => {
    const resizedSvg = svgContent
        .replace(/width="512" height="512"/g, `width="${size}" height="${size}"`)
        .replace(/viewBox="0 0 512 512"/g, `viewBox="0 0 512 512"`);
    writeFileSync(join(process.cwd(), 'public', 'assets', name), resizedSvg);
});

// favicon.ico를 위한 간단한 SVG 생성 (실제로는 ICO 형식이지만 SVG로 대체)
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <rect width="32" height="32" rx="5" fill="#0066cc"/>
  <path d="M8 8h16v4H8zm0 6h16v4H8zm0 6h12v4H8zm0 6h16v4H8z" fill="white" opacity="0.9"/>
</svg>`;
writeFileSync(join(process.cwd(), 'public', 'assets', 'favicon.svg'), faviconSvg);

console.log('✅ Icons generated successfully');
