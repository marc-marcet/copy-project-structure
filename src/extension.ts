import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';


export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "project-structure" is now active!');

    let disposable = vscode.commands.registerCommand('copy-project-structure.copyProject', async () => {
        const workspacePath = vscode.workspace.rootPath;
        if (workspacePath) {
            const exclusions = vscode.workspace.getConfiguration().get('projectStructure.exclusions', []);
            const includeFileContent = vscode.workspace.getConfiguration().get('projectStructure.includeFileContent', false);
            const projectStructure = getProjectStructure(workspacePath, exclusions, includeFileContent);
            await vscode.env.clipboard.writeText(projectStructure);
            vscode.window.showInformationMessage('Project structure copied to clipboard!');
        } else { vscode.window.showErrorMessage('No workspace opened!'); }
    });

    context.subscriptions.push(disposable);
}

function getProjectStructure(workspacePath: string, exclusions: string[], includeFileContent: boolean): string {
    let structure = vscode.workspace.name + '/\n';
    let fileContent = '';

    const buildStructure = (currentPath: string, indent: string = '') => {
        const files = fs.readdirSync(currentPath);
        files.forEach(file => {
            if (exclusions.includes(file)) { return; }
            const filePath = path.join(currentPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                structure += `${indent}├── ${file}/\n`;
                buildStructure(filePath, indent + '│   ');
            } else { structure += `${indent}├── ${file}\n`; }
        });
    };

    function buildFileContent(currentPath: string, indent: string = '') {
        const files = fs.readdirSync(currentPath);
        files.forEach(file => {
            if (exclusions.includes(file)) { return; }
            const filePath = path.join(currentPath, file);
            const stats = fs.statSync(filePath);
            if (!stats.isDirectory()) {
                fileContent += `\n${indent}${file}:\n\n`;
                const fileContentLines = fs.readFileSync(filePath, 'utf-8').split('\n');
                fileContentLines.forEach(line => {
                    fileContent += `${indent}${line}\n`;
                });
                fileContent += '\n';
            }
        });
    }

    buildStructure(workspacePath);
    if (includeFileContent) { buildFileContent(workspacePath);}

    return structure + '\n\n' + fileContent;
}

export function deactivate() {}
