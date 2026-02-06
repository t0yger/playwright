import { chromium, Page } from "@playwright/test";
import { RowInfo } from "./type";
import path from "path";
import { promises as fs } from "fs";
import { dirname } from "./const";

const reserve = async ({
  facility,
  room,
  date,
  time,
  releaseDate,
}: RowInfo) => {
  const browser = await chromium.launch({
    headless: false,
  });
  const page = await browser.newPage();
  await page.goto("https://www.shisetsu.city.yokohama.lg.jp/user/Home");
  await page
    .getByRole("tab", { name: "日時から探す （抽選申込は除く）" })
    .click();
  await page
    .getByLabel("日時から探す（抽選申込は除く）")
    .getByText("バスケットボール")
    .click();
  await page.locator('input[name="HomeModel.DateFrom"]').fill("2026-02-06");
  await page.locator('input[name="HomeModel.DateTo"]').fill("2026-03-03");
  await page.locator("#HomeModel_TimeFrom").selectOption("0000");
  await page.locator("#HomeModel_TimeTo").selectOption("2400");
  await page.getByText("月曜日").click();
  await page.getByText("火曜日").click();
  await page.getByText("空きコマ").click();
  await page.getByRole("button", { name: "検索" }).click();
  await page
    .getByRole("row", {
      name: "1 鶴見スポーツセンター 第一体育室Ｂ（半面） 令和8年2",
    })
    .locator("label")
    .click();
  await page.getByRole("button", { name: "さらに読み込む" }).click();
};

const getRowInfo = async (): Promise<RowInfo> => {
  const filePath = path.join(dirname, "targetReserve.json");
  const data = await fs.readFile(filePath);
  return JSON.parse(data.toString());
};

async function main() {
  try {
    const rowInfo = getRowInfo();
  } catch (error) {
    console.log(error.message);
    process.exit(0);
  }
}

await main();
