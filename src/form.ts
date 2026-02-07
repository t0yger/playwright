import { expect, Page } from "@playwright/test";
import { EnvInfo } from "./type";

export type FormType = "Normal" | "WithSound";
export type Facility =
  | "青葉スポーツセンター"
  | "旭スポーツセンター"
  | "磯子スポーツセンター"
  | "神奈川スポーツセンター"
  | "金沢スポーツセンター"
  | "港南スポーツセンター"
  | "港北スポーツセンター"
  | "栄スポーツセンター"
  | "瀬谷スポーツセンター"
  | "都筑スポーツセンター"
  | "鶴見スポーツセンター"
  | "戸塚スポーツセンター"
  | "中スポーツセンター"
  | "西スポーツセンター"
  | "保土ケ谷スポーツセンター"
  | "緑スポーツセンター"
  | "清水ケ丘公園体育館"
  | "たきがしら会館";

export const getFormType = (facility: Facility): FormType => {
  switch (facility) {
    case "神奈川スポーツセンター":
    case "都筑スポーツセンター":
    case "戸塚スポーツセンター":
    case "緑スポーツセンター":
    case "金沢スポーツセンター":
      return "WithSound";
    default:
      return "Normal";
  }
};

export type NormalFormInfo = {
  purpose: string;
  users: number;
};

export type WithSoundFormInfo = NormalFormInfo & {
  isSound: boolean;
  isSurroundSound: boolean;
};

export const inputForm = async (
  page: Page,
  formType: FormType,
  envInfo: Pick<EnvInfo, "purpose" | "isNoisy" | "isSurroundNoisy"> & {
    users: number;
  },
) => {
  const { purpose, users, isNoisy, isSurroundNoisy } = envInfo;
  await page.getByText(purpose).locator("xpath=ancestor::label").click();
  await page
    .locator(
      'input[name="AvailabilityDetailModel.Items[0].Reservation.Number"]',
    )
    .nth(0)
    .fill(users.toString());

  if (formType === "WithSound") {
    const isNoisyLabel = isNoisy ? "音を出す" : "音を出さない";
    await page.locator("label", { hasText: isNoisyLabel }).click();
    const isSurroundNoisyLabel = isSurroundNoisy ? "気にする" : "気にしない";
    await page.locator("label", { hasText: isSurroundNoisyLabel }).click();
  }

  const notice = page.locator("div.text-left");

  // 最後までスクロール
  await notice.evaluate(async (el) => {
    const step = 100;
    while (el.scrollTop + el.clientHeight < el.scrollHeight) {
      el.scrollTop += step;
      await new Promise((r) => setTimeout(r, 50));
    }
  });

  // checkbox が有効化されるのを待つ
  const checkbox = page.getByRole("checkbox", {
    name: "すべての注意事項を確認し、同意します。",
  });

  await expect(checkbox).toBeEnabled();

  await page
    .locator("label", { hasText: "すべての注意事項を確認し、同意します。" })
    .click();
};
