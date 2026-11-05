本地调试（从仓库根 D:\work\deepseek-harness）

  pnpm dsh web --patch ./scratch-plugin/cordis.yml

  - --patch overlay 把 test-stats 条目的 name 指向 src/index.ts，host 由 tsx 直接跑源码，改 src/index.ts
  后重启即生效，不用手动 build。
  - 根 package.json 的 predsh 钩子会在启动前自动执行 pnpm -C scratch-plugin run build，保证 dist/client.js
  存在（client-modules 必需，即使调试模式也要）。改 src/client/index.tsx 后重启即可，钩子会重建。
  - 想不开浏览器可加 --no-open；想避开 3080 可加 --port 0。
  - 注意：此模式下设置写入是只读的（config-editor 拒绝 overlay 定义的条目）。

  生产构建 → 安装 → 验证

  # 1. 构建插件产物（dist/index.js + dist/client.js）
  cd scratch-plugin && pnpm build

  # 2. 安装到 web profile（`.` 锚定到当前目录，必须在此目录执行；用全局 dsh）
  dsh plugin --profile web add .

  # 3. 回到仓库根验证
  cd .. && pnpm dsh web

  - 第 2 步会把 dsh-text-stats 作为 bundle 装进 ~/.dsh/profiles/web；本环境已装过，所以实际是幂等重装（实测 exit
  0，bundles 保留）。
  - 第 3 步不带 --patch，bundle 的 name: dsh-text-stats 经 main 解析到 dist/index.js，这就是"安装态"验证。