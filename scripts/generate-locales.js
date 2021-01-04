/* eslint-disable no-undef */
/* eslint-disable no-loop-func */
/* eslint-disable no-console */
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const translationMeta = {};

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locale');
const EN_LOCALE_PATH = path.join(LOCALES_DIR, 'en.json');

const mergeObjects = (t1, t2) => {
    const out = { ...t1 };
    // eslint-disable-next-line guard-for-in
    for (const key in t2) {
        if (typeof t2[key] === 'object') {
            out[key] = mergeObjects(out[key], t2[key]);
        }
        if (typeof t2[key] === 'string') {
            if (key in out) {
                if (t2[key] !== out[key]) {
                    out[key] = t2[key];
                }
            } else {
                out[key] = t2[key];
            }
        }
    }

    return out;
};

(async () => {
    try {
        console.log('Updating translations');
        console.log();
        console.log('  - Getting meta');
        const metaCall = await fetch('https://translate.xumm.dev/json/export-meta');
        const meta = await metaCall.json();
        console.log(`    > Got ${Object.keys(meta.languages).length} languages`);
        const languageValidate =
            Object.keys(meta.languages).sort().join(',') === Object.keys(meta['language-local-name']).sort().join(',');
        assert(languageValidate, 'Present languages (keys) do not match present language locale names.');

        console.log(`    > Got ${Object.keys(meta['language-code-alias']).length} aliased languages`);

        console.log('  - Getting translations & generating output files');
        for await (k of Object.keys(meta.languages)) {
            console.log(`    - Fetch ${k}`);
            const lCall = await fetch(`https://translate.xumm.dev/json/export-generated-lang/code:${k}`);
            const json = await lCall.json();

            const appTranslation = Object.keys(json.translations)
                .sort()
                .reduce((a, b) => {
                    const key = b.split('.');
                    if (key[0] === 'app') {
                        Object.assign(a, {
                            [key[1]]: Object.assign(a[key[1]] || {}, { [key[2]]: json.translations[b] }),
                        });
                    }
                    return a;
                }, {});

            console.log(`    - Write ${k}.json`);

            let fileContents = JSON.stringify(appTranslation, null, 2);

            if (k === 'en') {
                // eslint-disable-next-line import/no-dynamic-require
                const currentEN = require(EN_LOCALE_PATH);
                const merged = mergeObjects(currentEN, appTranslation);
                fileContents = JSON.stringify(merged, null, 2);
            }

            fs.writeFile(`${LOCALES_DIR}/${k === 'en' ? '' : 'generated/'}${k}.json`, fileContents, (err) => {
                if (err) throw new Error(`Error writing ${k}.json`);
            });

            const metaData = { name: json.name, source: `${json.code}.json` };
            Object.assign(translationMeta, { [k]: metaData });
            json.alias.forEach((a) => {
                console.log(`    - Alias ${k}: ${a}`);
                Object.assign(translationMeta, { [a]: metaData });
            });
        }

        console.log();
        console.log('  - Writing meta (meta.json)');
        const metaContents = JSON.stringify(translationMeta, null, 2);
        fs.writeFile(`${LOCALES_DIR}/meta.json`, metaContents, (err) => {
            if (err) throw new Error('Error writing meta.json');
        });

        console.log('  - Writing loader (index.ts)');
        let listOfRequires = '';
        for (key in translationMeta) {
            if (key !== 'en') {
                if (Object.prototype.hasOwnProperty.call(translationMeta, key)) {
                    const objectKey = /[^a-zA-Z_]/.test(key) ? `'${key}'` : key;
                    listOfRequires += `    ${objectKey}: require('./${translationMeta[key].source}'),\n`;
                }
            }
        }
        loaderContent = `export default {\n${listOfRequires}};\n`;
        fs.writeFile(`${LOCALES_DIR}/generated/index.ts`, loaderContent, (err) => {
            if (err) throw new Error('Error writing  index.ts');
        });

        console.log();
        console.log('Done');

        console.log();
    } catch (e) {
        console.log('Error: ', e.message);
        console.log();
    }
})();
