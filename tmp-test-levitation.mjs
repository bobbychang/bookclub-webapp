import { EnumerateWorkspaces } from 'file:///C:/Users/Robert/AppData/Roaming/fnm/node-versions/v24.14.0/installation/node_modules/levitation-client/dist/commands.js';

async function run() {
    console.time("EnumerateWorkspaces");
    try {
        const result = await EnumerateWorkspaces(false); // don't need verbose
        console.log(result.length + " workspaces found");
        console.log(result);
    } catch(e) {
        console.error(e);
    }
    console.timeEnd("EnumerateWorkspaces");
}
run();
