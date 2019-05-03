const Fs = require('fs');
const Path = require('path');
const execa = require('execa');
const globby = require('globby');
const yargsParser = require('yargs-parser');
const uuid = require('uuid');

async function main(flags) {
    const manifestPaths = (await globby('*/package.json', { cwd: flags.extensionDir })).map(p => Path.resolve(flags.extensionDir, p));
    const manifests = manifestPaths
        .map(p => ({ content: JSON.parse(Fs.readFileSync(p)), path: p }))
        .filter(m => flags.name ? m.content.name === flags.name : true);

    await Promise.all(manifests.map(async manifest => {
        const extDirectory = Path.dirname(manifest.path);

        const deps = (manifest.content.runtimeDependencies || [])
            .filter(dep => {
                const architectures = (dep.architectures || []);
                return architectures.length === 0 || architectures.includes('x64');
            })
            .filter(dep => {
                const platforms = dep.platforms || [];
                return platforms.length === 0 || platforms.includes('linux');
            });

        await Promise.all(deps.map(async dep => {
            console.log(`Installing ${dep.description} for ${manifest.content.name}@${manifest.content.version}`);

            const id = uuid.v4();
            const tarBall = Path.resolve('/tmp', `${id}.tgz`);
            const unpackDir = Path.resolve('/tmp', id);

            const installDir = Path.resolve(extDirectory, dep.installPath);
            const sourceDir = Path.resolve(unpackDir, dep.packageRootPath);

            await execa('curl', ['-L', dep.url, '-o', tarBall]);

            await execa('mkdir', ['-p', unpackDir]);
            await execa('tar', ['-xzf', tarBall, '-C', unpackDir], { stdio: 'inherit' });

            await execa('mkdir', ['-p', installDir]);

            await execa('cp', ['-a', `${sourceDir}/.`, `${installDir}/`]);

            const linuxSourceDir = Path.resolve(installDir, 'runtimes/linux-x64');
            const nativeSourceDir = Path.resolve(linuxSourceDir, 'native');

            if (await Fs.existsSync(linuxSourceDir)) {
                await execa('cp', ['-a', `${linuxSourceDir}/.`, `${installDir}/`]);
            }

            if (await Fs.existsSync(nativeSourceDir)) {
                await execa('cp', ['-a', `${nativeSourceDir}/.`, `${installDir}/`]);
            }

            await execa('rm', ['-r', tarBall, unpackDir]);

            const testPath = Path.resolve(extDirectory, dep.installTestPath);

            if (!Fs.existsSync(testPath)) {
                console.error(`Installation ${dep.description} for ${manifest.content.name}@${manifest.content.version} not verified:\n${testPath} not found.`);
            } else {
                console.log(`Installation ${dep.description} for ${manifest.content.name}@${manifest.content.version} succeeded`);
            }
        }));

        if (manifest.content.name === 'vsliveshare') {
            console.log('Executing vsliveshare specific prereq script');
            await execa('sh', [Path.resolve(extDirectory, 'out/deps/linux-prereqs.sh')]);
        }
    }));
}

main(yargsParser(process.argv.slice(2)))
    .catch(err => {
        throw err;
    })