import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureUserFile() {
  const authDirPath = path.resolve(__dirname, ".auth");
  const authFilePath = path.join(authDirPath, "user.json");
  const targetReserveJsonFilePath = path.join(__dirname, "targetReserve.json");

  // ディレクトリが無ければ作成
  await fs.mkdir(authDirPath, { recursive: true });

  // ファイルが無ければ作成
  await fs.writeFile(authFilePath, "{}", { encoding: "utf-8" });
  await fs.writeFile(targetReserveJsonFilePath, "{}", { encoding: "utf-8" });
}

ensureUserFile();
