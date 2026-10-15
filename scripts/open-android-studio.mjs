import { existsSync } from "node:fs";
import { delimiter, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const project = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../apps/mobile/android",
);
if (!existsSync(resolve(project, "settings.gradle"))) {
  console.error(
    "먼저 pnpm android:prebuild로 Android 프로젝트를 생성해 주세요.",
  );
  process.exit(1);
}
if (process.platform !== "darwin") {
  console.log(
    `Android Studio의 Open에서 다음 폴더를 선택해 주세요:\n${project}`,
  );
} else {
  // Pass this Node runtime to the IDE without changing the user's shell settings.
  const studioPath = [dirname(process.execPath), process.env.PATH]
    .filter(Boolean)
    .join(delimiter);
  const args = ["--env", `PATH=${studioPath}`];
  if (process.env.ANDROID_HOME)
    args.push("--env", `ANDROID_HOME=${process.env.ANDROID_HOME}`);
  args.push("-a", "Android Studio", project);
  console.log(
    "Android Studio가 이미 실행 중이면 종료한 뒤 이 명령을 다시 실행해 주세요.",
  );
  const opened = spawnSync("/usr/bin/open", args, { stdio: "inherit" });
  if (opened.error) console.error(opened.error.message);
  process.exit(opened.status ?? 1);
}
