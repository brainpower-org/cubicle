const Fs = require('fs');
const Path = require('path');
const execa = require('execa');
const globby = require('globby');
const cpy = require('cpy');
const yargsParser = require('yargs-parser');
const uuid = require('uuid');

async function main(flags) {
    const manifestPaths = (await globby('*/package.json', { cwd: flags.extensionDir })).map(p => Path.resolve(flags.extensionDir, p));
    const manifests = manifestPaths
        .map(p => ({ content: JSON.parse(Fs.readFileSync(p)), path: p }))
        .filter(m => flags.name ? m.name === flags.name : true);

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

            const tarBall = Path.resolve('/tmp', `${uuid.v4()}.tgz`);
            const installDir = Path.resolve(extDirectory, dep.installPath);


            await execa('curl', ['-L', dep.url, '-o', tarBall]);

            await execa('mkdir', ['-p', installDir]);
            await execa('tar', ['-xzf', tarBall, '--strip-components=4', '-C', installDir], { stdio: 'inherit' });

            if (dep.code === 'NetCoreLinux') {
                console.log('Performing NetCoreLinux specific copy tasks');

                await cpy([
                    Path.resolve(installDir, 'runtimes/linux-x64/*'), 
                    Path.resolve(installDir, 'runtimes/linux-x64/native/*')
                ], installDir);
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