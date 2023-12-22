const { promises } = require('fs');

const rootDir = 'tokens';
const packageDir = 'package';
const localizationsDir = `${packageDir}/localizations`;

function flatten(json) {
    const result = {};
    for (const key of Object.keys(json)) {
        if (typeof json[key] === 'object') {
            const nested = flatten(json[key]);
            for (const nestedKey of Object.keys(nested)) {
                let placeholder = '';
                if (nestedKey.endsWith('.value')) {
                    placeholder = nestedKey
                        .split('.')
                        .filter((element) => element !== 'value')
                        .join('.')
                } else placeholder = nestedKey;
                result[`${key}.${placeholder}`] = nested[nestedKey];
            }
        } else {
            if (key !== 'type') result[key] = json[key];
        }
    }
    return result;
}

async function generateLocalizations() {
    const metadata = await promises.readFile(`${rootDir}/$metadata.json`, 'utf-8');
    const filePaths = JSON.parse(metadata).tokenSetOrder;
    const themesContent = await promises.readFile(`${rootDir}/$themes.json`, 'utf-8');
    const themes = JSON.parse(themesContent);
    try {
        await promises.readdir(localizationsDir, { recursive: true });
        await promises.rm(localizationsDir, { recursive: true });
    } catch {
        console.warn(`${localizationsDir} does not exist`);
    } finally {
        await promises.mkdir(localizationsDir, { recursive: true });
    }

    themes.forEach((theme) => {
        const languageFiles = Object.entries(theme.selectedTokenSets)
            .filter(([, val]) => val !== 'disabled')
            .map(([tokenSet]) => {
                return `tokens/${filePaths.find((file) => file.endsWith(tokenSet))}.json`
            });
        languageFiles.forEach(async (file) => {
            const unflattenedJson = await promises.readFile(file, 'utf-8');
            await promises.writeFile(
                `${localizationsDir}/${file.split('/').pop()}`,
                JSON.stringify(flatten(JSON.parse(unflattenedJson)), null, '\t'),
                'utf8',
            );
        })
    })
}

generateLocalizations();