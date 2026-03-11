# WB4VSCode

VSCode extension untuk WibuScript (WB-Rust) dengan fitur:
- Syntax highlighting
- Autocomplete keyword dan built-in
- Runner untuk menjalankan file `.wb`

## Tutorial cara instal ekstensi (jika ekstensi wibu belum diinstall)

1. Buka folder `extras/wb4vscode` di VSCode.
2. Install VSCE `npm install -g @vscode/vsce``
3. Jalananin `code --install-extension wb4vscode-0.1.0.vsix`
4. Tekan `F5` untuk menjalankan Extension Development Host.

## Informasi (ga jelas)

Detek binary:
1. `wb4vscode.wibuPath` (jika udah diisi)
2. Auto-detetc: `target/debug/wibu`, `target/release/wibu`, `target/debug/wb`, `target/release/wb`
3. Fallback: jalankan `wibu` dari PATH 

Contoh build binary WB-Rust:

```bash
cargo build -p wibu
```

Setelah itu, buka file `.wb` dan jalankan perintah runner.
