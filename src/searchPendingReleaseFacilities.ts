import { chromium, Page } from "@playwright/test";
import inquirer from "inquirer";
import ora from "ora";
import { getEnvInfo } from "./env";
import { promises as fs } from "fs";
import path from "path";
import { dirname } from "./const";
import { EnvInfo, RowInfo } from "./type";

const getPendingReleaseFacilities = async ({
  startDate,
  endDate,
  startTime,
  endTime,
  targetDayOfWeek,
  page,
}: EnvInfo & { page: Page }) => {
  await page.goto("https://www.shisetsu.city.yokohama.lg.jp/user/Home");
  await page
    .getByRole("tab", { name: "日時から探す （抽選申込は除く）" })
    .click();
  await page
    .getByLabel("日時から探す（抽選申込は除く）")
    .getByText("バスケットボール")
    .click();
  await page.locator('input[name="HomeModel.DateFrom"]').fill(startDate);
  await page.locator('input[name="HomeModel.DateTo"]').fill(endDate);
  await page.locator("#HomeModel_TimeFrom").selectOption(startTime);
  await page.locator("#HomeModel_TimeTo").selectOption(endTime);
  for (const date of targetDayOfWeek) {
    await page.getByText(date).click();
  }
  await page.getByText("開放待ち").click();
  await page.getByRole("button", { name: "検索" }).click();
  await page.waitForTimeout(2000);
  const isNoHit = await page
    .getByText("条件に該当する施設はありません。")
    .isVisible();
  if (isNoHit) {
    return [];
  }
  const rows = await getRowsInfo(page);
  return rows;
};

const getRowsInfo = async (page: Page): Promise<RowInfo[]> => {
  var rowsInfo: RowInfo[] = [];

  const locator = page.locator("table > tbody > tr");
  const locatorCount = await locator.count();
  for (let i = 0; i < locatorCount; i++) {
    const tds = locator.nth(i).locator("td");
    const facility = (await tds.nth(1).textContent())?.trim() ?? "";
    const room = (await tds.nth(2).textContent())?.trim() ?? "";
    const date = (await tds.nth(3).textContent())?.trim() ?? "";
    const time = (await tds.nth(4).textContent())?.trim() ?? "";
    const releaseDate = (await tds.nth(5).textContent())?.trim() ?? "";
    rowsInfo.push({
      facility,
      room,
      date,
      time,
      releaseDate,
    });
  }

  await page.close();
  return rowsInfo;
};

async function main() {
  try {
    const envInfo = getEnvInfo();
    const spinner = ora(
      `以下の期間で開放待ちの施設情報を取得中...\n日付: ${envInfo.startDate}~${envInfo.endDate}\n時刻: ${envInfo.startTime}~${envInfo.endTime}`,
    ).start();
    const browser = await chromium.launch({
      headless: false,
    });
    const page = await browser.newPage();
    const results = await getPendingReleaseFacilities({ ...envInfo, page });
    const choices = results.map((val, index) => {
      return {
        index: index,
        message: `施設: ${val.facility} ${val.room}\n日付: ${val.date} ${val.time}\n開放時間: ${val.releaseDate}`,
      };
    });
    if (choices.length === 0) {
      spinner.fail("指定の期間では開放待ちの施設はありませんでした");
      await page.close();
      await browser.close();
      process.exit(0);
    } else {
      await page.close();
      await browser.close();
      spinner.succeed("取得完了");
    }
    const answer = await inquirer.prompt([
      {
        type: "checkbox",
        name: "search result",
        message: "開放予定の施設は以下です。1つだけ選択してください",
        loop: false,
        choices: choices.map((val) => val.message),
      },
    ]);

    console.log("施設情報を保存しました");
    const selectIndex: number = choices.filter(
      (val) => val.message === answer["search result"][0],
    )[0].index;
    await fs.writeFile(
      path.join(dirname, "targetReserve.json"),
      JSON.stringify(results[selectIndex]),
    );
    process.exit(0);
  } catch (error) {
    console.log((error as Error)?.message);
    process.exit(0);
  }
}

await main();
