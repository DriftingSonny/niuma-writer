import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    let originalText: string | null = null;
    let currentPosition = 0;
    let isActive = false;
    let editor: vscode.TextEditor | undefined;
    let isUpdating = false;
    let originalIsDirty = false;

    // 切换插件状态的命令
    const toggleCommand = vscode.commands.registerCommand('niuma-writer.toggle', () => {
        editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('请打开一个编辑器窗口');
            return;
        }

        // 如果插件未激活，则激活它
        if (!isActive) {
            const document = editor.document;
            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            
            originalText = document.getText();
            currentPosition = 0;
            originalIsDirty = document.isDirty;
            
            // 清空文档内容（隐藏原文）
            editor.edit(editBuilder => {
                editBuilder.replace(fullRange, '');
            }).then(success => {
                if (success) {
                    isActive = true;
                    vscode.window.showInformationMessage('niuma_writer 已激活，开始输入吧！');
                }
            });
        } 
        // 如果插件已激活，则恢复原文
        else {
            if (originalText !== null && editor) {
                const document = editor.document;
                const fullRange = new vscode.Range(
                    document.positionAt(0),
                    document.positionAt(document.getText().length)
                );
                
                editor.edit(editBuilder => {
                    editBuilder.replace(fullRange, originalText as string);
                }).then(success => {
                    if (success) {
                        if (!originalIsDirty) {
                            document.save().then(() => {
                                isActive = false;
                                originalText = null;
                                currentPosition = 0;
                                originalIsDirty = false;
                                vscode.window.showInformationMessage('niuma_writer 已停用');
                            });
                        } else {
                            isActive = false;
                            originalText = null;
                            currentPosition = 0;
                            originalIsDirty = false;
                            vscode.window.showInformationMessage('niuma_writer 已停用');
                        }
                    }
                });
            }
        }
    });

    // 监听文本输入事件
    const onTypeDisposable = vscode.workspace.onDidChangeTextDocument(event => {
        if (!isActive || !originalText || !editor || event.document !== editor.document || isUpdating) {
            return;
        }

        const changes = event.contentChanges;
        if (changes.length > 0 && changes[0].text.length > 0 && !changes[0].text.includes('\n')) {
            currentPosition = Math.min(currentPosition + 1, originalText.length);
            const textToShow = originalText.substring(0, currentPosition);
            
            const fullRange = new vscode.Range(
                event.document.positionAt(0),
                event.document.positionAt(event.document.getText().length)
            );
            
            isUpdating = true;
            editor.edit(editBuilder => {
                editBuilder.replace(fullRange, textToShow);
            }).then(success => {
                isUpdating = false;
                if (success && editor) {
                    const newPosition = event.document.positionAt(currentPosition);
                    editor.selection = new vscode.Selection(newPosition, newPosition);
                }
            });
        }
    });

    context.subscriptions.push(toggleCommand, onTypeDisposable);
}

export function deactivate() { 
    // 插件停用逻辑，当前不需要特殊处理
}
