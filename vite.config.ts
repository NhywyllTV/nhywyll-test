import { defineConfig } from 'vite';
import injectHTML from 'vite-plugin-html-inject';
import Sitemap from 'vite-plugin-sitemap';
import { resolve } from 'path';
import { readdirSync } from 'fs';

// Find all HTML files in the root directory to automate entry points
const getHtmlEntries = () => {
  const entries: Record<string, string> = {};
  const files = readdirSync('./');
  
  files.forEach(file => {
    if (file.endsWith('.html')) {
      let name = file.replace('.html', '');
      if (file === 'index.html') name = 'main';
      if (file === '404.html') name = 'notFound';
      entries[name] = resolve('./', file);
    }
  });
  
  return entries;
};

export default defineConfig({
  plugins: [
    injectHTML(),
    Sitemap({
      hostname: 'https://nhywyll.com/',
      exclude: ['/404'],
      generateRobotsTxt: false,
      readable: true,
    }),
  ],
  base: '/',
  build: {
    rollupOptions: {
      input: getHtmlEntries(),
    },
  },
});