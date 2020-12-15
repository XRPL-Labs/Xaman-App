const fetch = require('node-fetch');
const fs = require('fs');
const assert = require('assert');

const translationMeta = {};

const main = async () => {
  try {
    console.log('Updating translations');
    console.log();
    console.log('  - Getting meta');
    const metaCall = await fetch('https://translate.xumm.dev/json/export-meta');
    const meta = await metaCall.json();
    console.log(`    > Got ${Object.keys(meta.languages).length} languages`);
    const langConfigValid = Object.keys(meta.languages).sort().join(',') === Object.keys(meta['language-local-name']).sort().join(',');
    assert(langConfigValid, 'Present languages (keys) do not match present language locale names.');

    console.log(`    > Got ${Object.keys(meta['language-code-alias']).length} aliassed languages`);

    console.log('  - Getting translations & generating output files');
    for await (k of Object.keys(meta.languages)) {
      console.log(`    - Fetch ${k}`);
      const lCall = await fetch(`https://translate.xumm.dev/json/export-generated-lang/code:${k}`);
      const json = await lCall.json();

      // console.log('code', json.code)
      // console.log('fallback', json.fallback)
      // console.log('alias', json.alias)
      // console.log('name', json.name)

      const appTranslation = Object.keys(json.translations).sort().reduce((a, b) => {
        const key = b.split('.');
        if (key[0] === 'app') {
          Object.assign(a, { [key[1]]: Object.assign(a[key[1]] || {}, { [key[2]]: json.translations[b] }) });
        }
        return a;
      }, {});

      console.log(`    - Write ${k}.json`);
      const fileContents = JSON.stringify(appTranslation, null, 2);
      const g = 'generated/';
      fs.writeFile(`${__dirname}/${k === 'en' ? '' : g}${k}.json`, fileContents, err => {
        if (err) throw new Error(`Error writing ${k}.json`);
      });

      const metaData = { name: json.name, source: `${json.code}.json` };
      Object.assign(translationMeta, { [k]: metaData });
      json.alias.forEach(a => {
        console.log(`    - Alias ${k}: ${a}`);
        Object.assign(translationMeta, { [a]: metaData });
      });
    }

    console.log();
    console.log('  - Writing meta (meta.json)');
    const metaContents = JSON.stringify(translationMeta, null, 2);
    fs.writeFile(`${__dirname}/meta.json`, metaContents, err => {
      if (err) throw new Error(`Error writing ${k}.json`);
    });

    console.log();
    console.log('Done');

    console.log();
  } catch (e) {
    console.log('Error: ', e.message);
    console.log();
  }
};

main();
