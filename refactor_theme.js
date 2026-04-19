const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const stat = fs.statSync(dir);
  if (!stat.isDirectory()) return;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      const original = content;

      // Replace rgba matches
      content = content.replace(/124,\s*58,\s*237/g, '160, 120, 48');
      
      // Replace violet tailwind classes
      const regex = /\b([a-z]+:)?([a-z]+-)?violet-(\d+)(\/[0-9]+)?\b/g;
      
      content = content.replace(regex, (match, modifier_or_prefix, property_prefix, weight, opacity) => {
        modifier_or_prefix = modifier_or_prefix || '';
        property_prefix = property_prefix || '';
        opacity = opacity || '';
        
        let newColor = '';
        const w = parseInt(weight);
        
        if (w >= 500) {
            newColor = 'brand';
        } else if (w >= 300) {
            newColor = 'brand-light';
        } else if (w >= 200) {
            newColor = 'brand-lighter';
        } else {
            // 50, 100
            newColor = `brand/${w === 50 ? '5' : '10'}`;
            // If there's already an opacity modifier and we inject one, it might be weird.
            // e.g., brand/5/30 isn't valid Tailwind.
            if (opacity) {
                newColor = 'brand'; // fallback so it becomes brand/30
            }
        }
        
        return `${modifier_or_prefix}${property_prefix}${newColor}${opacity}`;
      });

      // After doing standard replacement, some things might be a bit weird. 
      // For instance: `focus:ring-brand/30` works natively.
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'apps/web/src'));
console.log('Theme refactoring completed.');
