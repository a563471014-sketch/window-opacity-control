const vscode = require('vscode');
const cp = require('child_process');
const path = require('path');

// 定位当前 IDE 的 Windows 进程名（UI 扩展在客户端本地运行，process.execPath 即 IDE exe）
function appProcessName() {
    return path.basename(process.execPath).replace(/\.exe$/i, '');
}

// PowerShell 脚本：给指定进程的【所有可见主窗口】设置透明度（0~255）
// 用 here-string 定义 C# 类型；脚本通过 -EncodedCommand (UTF-16LE base64) 传递，避免引号/换行转义问题
function psScript(procName, alpha) {
    return [
        "Add-Type @'",
        "using System;",
        "using System.Runtime.InteropServices;",
        "public class WinOp {",
        '  [DllImport("user32.dll", EntryPoint="GetWindowLongW")] public static extern int GetWindowLong(IntPtr h, int i);',
        '  [DllImport("user32.dll", EntryPoint="SetWindowLongW")] public static extern int SetWindowLong(IntPtr h, int i, int v);',
        '  [DllImport("user32.dll")] public static extern bool SetLayeredWindowAttributes(IntPtr h, uint k, byte a, uint f);',
        '  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr h);',
        "}",
        "'@",
        `$ps = Get-Process -Name '${procName}' -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 -and [WinOp]::IsWindowVisible($_.MainWindowHandle) }`,
        "if (-not $ps) { Write-Error 'no window found'; exit 1 }",
        "foreach ($p in $ps) {",
        "  $h = $p.MainWindowHandle",
        "  $ex = [WinOp]::GetWindowLong($h, -20)",
        "  [WinOp]::SetWindowLong($h, -20, ($ex -bor 0x80000)) | Out-Null",
        `  [WinOp]::SetLayeredWindowAttributes($h, 0, ${alpha}, 0x2) | Out-Null`,
        "  Write-Output ('OK ' + $p.ProcessName + ' hwnd=' + $h)",
        "}"
    ].join('\r\n');
}

function encodeCommand(script) {
    // UTF-16LE（不带 BOM）-> base64，供 powershell -EncodedCommand 使用
    return Buffer.from(script, 'utf16le').toString('base64');
}

function applyAlpha(alpha) {
    const proc = appProcessName();
    const b64 = encodeCommand(psScript(proc, alpha));
    return new Promise((resolve) => {
        cp.execFile('powershell', ['-NoProfile', '-NonInteractive', '-EncodedCommand', b64], { windowsHide: true, timeout: 10000 }, (err, stdout, stderr) => {
            if (err) {
                vscode.window.showErrorMessage('透明度设置失败: ' + (stderr || err.message).trim());
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

function activate(context) {
    let cfg = vscode.workspace.getConfiguration('windowOpacity');
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'windowOpacity.set';
    statusBarItem.tooltip = '点击设置透明度';

    // 读取：优先本扩展配置；未设置时沿用旧的 opacityControl.opacity（兼容之前的透明度）
    const readOpacity = () => {
        const mine = cfg.get('opacity', undefined);
        if (mine !== undefined) return mine;
        const old = vscode.workspace.getConfiguration('opacityControl').get('opacity', undefined);
        return old !== undefined ? old : 255;
    };
    const readStep = () => cfg.get('step', 5);

    const render = () => {
        statusBarItem.text = `透明度: ${readOpacity()}`;
        statusBarItem.show();
    };
    const apply = (v) => {
        render();
        applyAlpha(v);
    };
    const set = async (v) => {
        await cfg.update('opacity', v, vscode.ConfigurationTarget.Global);
    };
    const change = async (d) => {
        const v = Math.max(0, Math.min(255, readOpacity() + d * readStep()));
        await set(v);
        cfg = vscode.workspace.getConfiguration('windowOpacity');
        apply(v);
    };

    vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('windowOpacity.opacity') || e.affectsConfiguration('opacityControl.opacity')) {
            cfg = vscode.workspace.getConfiguration('windowOpacity');
            apply(readOpacity());
        }
    });

    context.subscriptions.push(
        vscode.commands.registerCommand('windowOpacity.decrease', () => change(-1)),
        vscode.commands.registerCommand('windowOpacity.increase', () => change(1)),
        vscode.commands.registerCommand('windowOpacity.set', async () => {
            const v = parseInt(await vscode.window.showInputBox({ prompt: '输入透明度 (0-255)' }));
            if (!isNaN(v) && v >= 0 && v <= 255) { await set(v); cfg = vscode.workspace.getConfiguration('windowOpacity'); apply(v); }
            else vscode.window.showErrorMessage('输入无效');
        })
    );

    apply(readOpacity());
}

exports.activate = activate;
