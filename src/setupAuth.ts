import test from "@playwright/test";
import path from "path";
import fs from "node:fs";

const authFile = path.join(path.resolve(__dirname), ".auth/user.json");
fs.writeFileSync(authFile, JSON.stringify({}));

test("auth", async ({ page }) => {
  await page.goto("/user/Login");

  await page.getByRole("textbox", { name: "利用者ID" }).click();
  await page
    .getByRole("textbox", { name: "利用者ID" })
    .fill(process.env.USER_ID ?? "");
  console.log(process.env.USER_ID);
  await page.getByRole("textbox", { name: "パスワード" }).click();
  await page
    .getByRole("textbox", { name: "パスワード" })
    .fill(process.env.PASSWORD ?? "");

  await page.getByRole("button", { name: "ログイン" }).click();

  await page.waitForTimeout(2000);

  await page.context().storageState({ path: authFile });
  await page.close();
});
