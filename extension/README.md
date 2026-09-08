# Window Opacity Control

使用 Windows API 调整 IDE 窗口透明度，让代码窗口半透明，方便对照参考文档或桌面内容。

## 效果预览

![效果预览](https://raw.githubusercontent.com/a563471014-sketch/window-opacity-control/master/extension/preview.png)

## 功能特性

- **调整窗口透明度**：支持 0（全透明）~ 255（完全不透明）的透明度范围。
- **所有可见主窗口生效**：本地与 Remote-SSH 窗口同步生效，无需逐个窗口设置。
- **独立配置**：透明度值可独立配置，重启后自动恢复。
- **快捷键调节**：内置快捷键快速降低 / 提高透明度。
- **状态栏调节**：状态栏实时显示当前透明度，点击即可输入数值精确设置。
- **兼容旧配置**：未设置时自动沿用旧的 `opacityControl.opacity` 配置值。

## 使用方法

### 快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl + Alt + Z` | 降低窗口透明度 |
| `Ctrl + Alt + C` | 提高窗口透明度 |

### 状态栏

点击状态栏右侧的「透明度: xxx」图标，输入 0 ~ 255 的数值即可精确设置。

### 设置项

| 设置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `windowOpacity.opacity` | number | 255 | 窗口透明度 (0 ~ 255，255 表示完全不透明) |
| `windowOpacity.step` | number | 5 | 每次调整的步长 (1 ~ 255) |

可在设置界面搜索「Window Opacity Control」进行配置。

## 工作原理

扩展通过 PowerShell 调用 Windows `user32.dll` 的 Win32 API，将当前 IDE 进程的所有可见主窗口设置为分层窗口（Layered Window），并调用 `SetLayeredWindowAttributes` 设置透明度，不依赖任何第三方库。
