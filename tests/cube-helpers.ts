import { expect, type Page } from "@playwright/test";
import { PerspectiveCamera, Vector3 } from "three";
import { FRAMES, position, type Arrow } from "../src/features/game/core/engine";
export async function tap(
  page: Page,
  arrow: Arrow,
  focused: boolean,
  offsetY = 0,
  fraction = 0.6,
) {
  await expect(page.locator(".scene-container")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw Error("Canvas absent");
  const camera = new PerspectiveCamera(40, box.width / box.height, 0.1, 1000),
    f = FRAMES[arrow.cells.at(-1)!.face];
  camera.position
    .copy(
      focused
        ? new Vector3(...f.n)
            .multiplyScalar(8.5)
            .addScaledVector(new Vector3(...f.u), 0.8)
            .addScaledVector(new Vector3(...f.v), 0.8)
        : new Vector3(6, 5.2, 7),
    )
    .normalize()
    .multiplyScalar(9);
  camera.up.copy(focused ? new Vector3(...f.v) : new Vector3(0, 1, 0));
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const point = new Vector3(...position(arrow.cells[0], 3, 0.07))
    .lerp(new Vector3(...position(arrow.cells[1], 3, 0.07)), fraction)
    .project(camera);
  await page.clock.runFor(40);
  await page.touchscreen.tap(
    box.x + ((point.x + 1) * box.width) / 2,
    box.y + ((1 - point.y) * box.height) / 2 + offsetY,
  );
}
