import test, { Page } from "@playwright/test";
import path from "path";
import fs from "node:fs";
import { EnvInfo } from "./type";
import { dirname } from "./const";

export const authFile = path.join(path.resolve(dirname), ".auth/user.json");
fs.writeFileSync(authFile, JSON.stringify({}));

type SetupAuthArgs = Pick<EnvInfo, "userId" | "password"> & { page: Page };
export const setupAuth = async ({ userId, password, page }: SetupAuthArgs) => {
  await page.goto("https://www.shisetsu.city.yokohama.lg.jp/user/Login");

  await page.getByRole("textbox", { name: "利用者ID" }).click();
  await page.getByRole("textbox", { name: "利用者ID" }).fill(userId);
  await page.getByRole("textbox", { name: "パスワード" }).click();
  await page.getByRole("textbox", { name: "パスワード" }).fill(password);

  await page.getByRole("button", { name: "ログイン" }).click();

  await page.waitForTimeout(2000);

  await page.context().storageState({ path: authFile });
};
