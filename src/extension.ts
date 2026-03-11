import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";

const KEYWORDS = [
  "bikin",
  "fun",
  "kalo",
  "ato",
  "bentar",
  "ulang",
  "di",
  "balikin",
  "baka",
  "lanjut",
  "berhenti",
  "true",
  "false",
  "nil",
  "kosong",
  "butuh",
  "ekspor",
  "nani",
  "yamete",
  "sugoi"
];

const BUILTINS = [
  "baka",
  "bakaf",
  "format",
  "input",
  "panjang",
  "tipe",
  "angka",
  "teks",
  "stdout",
  "stderr",
  "baca_file",
  "tulis_file",
  "append_file",
  "cwd",
  "env_get",
  "env_set",
  "sqrt",
  "sin",
  "cos",
  "tan",
  "pow",
  "abs",
  "floor",
  "ceil",
  "round",
  "regex_cocok",
  "regex_cari",
  "regex_ganti",
  "tcp_connect",
  "tcp_listen",
  "tcp_accept",
  "tcp_send",
  "tcp_recv",
  "tcp_local_addr",
  "tcp_close",
  "udp_bind",
  "udp_send",
  "udp_recv",
  "udp_local_addr",
  "udp_close"
];

let runnerTerminal: vscode.Terminal | undefined;

function buildCompletions(): vscode.CompletionItem[] {
  const items: vscode.CompletionItem[] = [];

  for (const kw of KEYWORDS) {
    const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
    item.detail = "WibuScript keyword";
    items.push(item);
  }

  for (const fn of BUILTINS) {
    const item = new vscode.CompletionItem(fn, vscode.CompletionItemKind.Function);
    item.detail = "Built-in function";
    items.push(item);
  }

  const snippets: Array<{ label: string; snippet: string; detail: string }> = [
    {
      label: "fun",
      snippet: "fun ${1:nama}(${2:args}):\n\t$0",
      detail: "Function declaration"
    },
    {
      label: "kalo",
      snippet: "kalo ${1:kondisi}:\n\t$0",
      detail: "If block"
    },
    {
      label: "bentar",
      snippet: "bentar ${1:kondisi}:\n\t$0",
      detail: "While loop"
    },
    {
      label: "ulang",
      snippet: "ulang ${1:item} di ${2:array}:\n\t$0",
      detail: "For-each array"
    }
  ];

  for (const snippet of snippets) {
    const item = new vscode.CompletionItem(snippet.label, vscode.CompletionItemKind.Snippet);
    item.insertText = new vscode.SnippetString(snippet.snippet);
    item.detail = snippet.detail;
    items.push(item);
  }

  return items;
}

async function pathExists(filePath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function findWibuBinary(): Promise<string> {
  const config = vscode.workspace.getConfiguration("wb4vscode");
  const configured = (config.get<string>("wibuPath") || "").trim();
  if (configured.length > 0) {
    return configured;
  }

  const autoDetect = config.get<boolean>("autoDetectBinary", true);
  if (autoDetect) {
    const folders = vscode.workspace.workspaceFolders || [];
    const exeExt = process.platform === "win32" ? ".exe" : "";
    const names = [`wibu${exeExt}`, `wb${exeExt}`];
    const variants = ["debug", "release"];

    for (const folder of folders) {
      for (const variant of variants) {
        for (const name of names) {
          const candidate = path.join(folder.uri.fsPath, "target", variant, name);
          if (await pathExists(candidate)) {
            return candidate;
          }
        }
      }
    }
  }

  return "wibu";
}

function quoteArg(value: string): string {
  if (value.includes(" ") || value.includes("\t")) {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return value;
}

async function runCurrentFile(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage("Tidak ada file yang aktif.");
    return;
  }

  const doc = editor.document;
  if (doc.languageId !== "wibuscript" && !doc.fileName.endsWith(".wb")) {
    vscode.window.showWarningMessage("File aktif bukan WibuScript (.wb).");
    return;
  }

  if (doc.isDirty) {
    await doc.save();
  }

  const filePath = doc.fileName;
  const bin = await findWibuBinary();
  const cmd = `${quoteArg(bin)} ${quoteArg(filePath)}`;

  if (!runnerTerminal) {
    runnerTerminal = vscode.window.createTerminal("WB Runner");
  }
  runnerTerminal.show(true);
  runnerTerminal.sendText(cmd, true);
}

export function activate(context: vscode.ExtensionContext) {
  const completions = buildCompletions();

  const provider = vscode.languages.registerCompletionItemProvider(
    "wibuscript",
    {
      provideCompletionItems() {
        return completions;
      }
    },
    ..."abcdefghijklmnopqrstuvwxyz_".split("")
  );

  const runCommand = vscode.commands.registerCommand("wb4vscode.runFile", runCurrentFile);

  context.subscriptions.push(provider, runCommand);
}

export function deactivate() {
  if (runnerTerminal) {
    runnerTerminal.dispose();
    runnerTerminal = undefined;
  }
}
