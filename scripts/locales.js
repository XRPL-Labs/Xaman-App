/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-console */

/*
   Add missing translation keys to languages
*/

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locale');
const TRANSLATIONS_DIR = path.join(LOCALES_DIR, 'translations');
const FORMAT_REGEX = /("isFormat":\s*)([^,\n\r]+)/g;

const mergeObjects = (t1, t2) => {
    const out = { ...t1 };
    // eslint-disable-next-line guard-for-in
    for (const key in t2) {
        if (key in out) {
            if (typeof t2[key] === 'object') {
                out[key] = mergeObjects(out[key], t2[key]);
            }
            if (typeof t2[key] === 'string') {
                out[key] = t2[key];
            }
        }
    }

    return out;
};

const sync = () => {
    const dir = fs.readdirSync(TRANSLATIONS_DIR);
    for (let i = 0; i < dir.length; i++) {
        if (!dir[i].endsWith('.json')) {
            continue;
        }

        const format = [];
        const file = `${TRANSLATIONS_DIR}/${dir[i]}`;
        const content = fs.readFileSync(file, 'utf-8');
        let contentNormalized = '';

        for (let line of content.split('\n')) {
            if (line.split(FORMAT_REGEX).length === 4) {
                // eslint-disable-next-line prefer-destructuring
                const index = format.push(line.split(FORMAT_REGEX)[2]);
                line = line.replace(FORMAT_REGEX, `$1"FORMAT_REPLACED${index}"`);
            }
            contentNormalized += line;
        }

        const contentNormalizedJson = JSON.parse(contentNormalized);

        const currentENJson = require(path.join(LOCALES_DIR, 'en.json'));
        const merged = mergeObjects(currentENJson, contentNormalizedJson);

        if (Object.prototype.hasOwnProperty.call(contentNormalizedJson, 'moment')) {
            merged.moment = contentNormalizedJson.moment;
        }

        let fileContent = JSON.stringify(merged, null, 2);

        if (format.length > 0) {
            for (let j = 0; j < format.length; j++) {
                fileContent = fileContent.replace(`"FORMAT_REPLACED${j + 1}"`, format[j]);
            }
        }

        fs.writeFileSync(file, fileContent, (err) => {
            if (err) throw new Error(`Error writing ${file}`);
        });
    }

    console.log('Sync Done!');
};

const check = () => {
    const dir = fs.readdirSync(TRANSLATIONS_DIR);
    for (let i = 0; i < dir.length; i++) {
        if (!dir[i].endsWith('.json')) {
            continue;
        }

        const file = `${TRANSLATIONS_DIR}/${dir[i]}`;
        const content = fs.readFileSync(file, 'utf-8');

        const currentENContent = fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf-8');

        let missMatched = false;

        for (const line of currentENContent.split('\n')) {
            const key = line.match(/"([^"]+)":/g);
            if (!key) {
                continue;
            }
            if (content.indexOf(key[0]) === -1) {
                missMatched = key[0].replace('"', '').replace('":', '');
                break;
            }
        }

        if (missMatched) {
            console.error(
                `Error: translations missing key "${missMatched}" in ${dir[i]}, please run "npm run sync-locals" command!`,
            );
            process.exit(1);
            return;
        }
    }
};

const remove = (key) => {
    try {
        const command = `grep -rl '${key}' ${LOCALES_DIR} | xargs sed -i '' '/${key}/d'`;
        execSync(command, { encoding: 'utf-8' });
        console.log(`Locale with key "${key}" have been deleted from the translation files`);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

switch (process.argv[2]) {
    case '--check':
        check();
        break;
    case '--sync':
        sync();
        break;
    case '--remove':
        if (!process.argv[3]) {
            console.error('missing key argument!');
            return;
        }
        remove(process.argv[3]);
        break;
    default:
        break;
}
