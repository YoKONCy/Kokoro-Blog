# 音视频 & Three.js 架构预留

> 不写实现代码，但确保架构上**不阻塞**未来集成。

## 组件插槽

```
src/components/
├── media/                     # 音视频
│   ├── AudioPlayer.svelte     # 空壳 + TODO
│   └── VideoPlayer.svelte
└── three/                     # 3D
    └── Scene.svelte           # Three.js 场景容器
```

## MDX 用法预留

```mdx
<AudioPlayer src="/audio/bgm.mp3" title="背景音乐" />
<VideoPlayer src="/video/demo.mp4" poster="/img/poster.jpg" />
<ThreeScene model="/models/avatar.glb" />
```

## 未来依赖

- 音视频: `plyr` 或 `vidstack`
- 3D: `three` + `@threlte/core`（Svelte Three.js 绑定）

## 构建考量

- Three.js ~600KB → 必须 `client:visible` + 动态 import
- 视频 → Cloudflare Stream 或 R2 直链
- 音频 → 预留 Web Audio API 可视化接口
