---
title: "Zone Culling Nearly Killed My 3D App"
description: "A Three.js optimization that hid 2041 of 2320 objects, causing black screens and a day of debugging. The fix? Trust the framework."
date: 2026-02-19
tags: ["three.js", "performance", "debugging", "3d"]
---

I almost shipped a 3D application that rendered a black screen on every room transition. The cause? My own "optimization."

## The Setup

I was building a multi-room 3D visualization -- think virtual workspace where users navigate between distinct spaces. Each room had between 50 and 400 objects: walls, floors, furniture, textures, lights. The entire scene graph held 2,320 objects.

Performance was fine on desktop but sluggish on tablets. So I did what any reasonable developer would do: I added culling.

## The Optimization That Wasn't

The idea was simple. Divide the 3D space into zones. When the user enters a zone, hide every object that doesn't belong to that zone. Fewer objects in the render loop means faster frames. Textbook optimization.

```javascript
// The "optimization" that broke everything
function applyZoneCulling(scene, activeZone) {
  let hidden = 0;
  scene.traverse((obj) => {
    if (obj.userData.zone && obj.userData.zone !== activeZone) {
      obj.visible = false;
      hidden++;
    } else {
      obj.visible = true;
    }
  });
  console.log(`Zone culling: hid ${hidden} of ${scene.children.length} objects`);
}
```

I tagged every mesh with a `zone` property during scene construction. On zone change, flip visibility. Clean, simple, fast.

Except for one thing: **it hid 2,041 of 2,320 objects**. Every time.

## The Black Screen

The problem wasn't the logic -- it was the zone assignments. Many objects had no zone tag at all (ambient lights, shared geometry, structural elements). My culling function treated untagged objects as belonging to no zone, which meant they passed through the visibility filter. But tagged objects from *other* zones were aggressively hidden.

The result: switching from Zone A to Zone B would hide everything in Zone A -- including shared walls, floor planes, and environment maps. The user would see... nothing. A black void with a loading spinner that never resolved.

The console faithfully logged: `Zone culling: hid 2041 of 2320 objects`. I ignored it for two days because I assumed most objects *should* be hidden. More hidden objects means better performance, right?

## The Fix

After an embarrassing amount of time, I ripped out the custom zone culling entirely and let Three.js do what it already does out of the box: **frustum culling**.

Frustum culling is built into every Three.js mesh by default. The renderer checks whether each object's bounding sphere intersects the camera's view frustum. If it's off-screen, it doesn't get rendered. No zone tags, no manual visibility toggling, no guessing.

```javascript
// What I should have done from the start:
// Trust the framework's built-in frustum culling.

// Three.js enables this by default on all meshes:
// mesh.frustumCulled = true;  // this is the default

// If you need to verify it's working, you can check
// how many objects the renderer is actually drawing:
function logRenderStats(renderer) {
  const info = renderer.info;
  console.log(`Render stats:`, {
    drawCalls: info.render.calls,
    triangles: info.render.triangles,
    geometries: info.memory.geometries,
    textures: info.memory.textures,
  });
}

// For large scenes, ensure bounding spheres are computed:
scene.traverse((obj) => {
  if (obj.isMesh && obj.geometry) {
    obj.geometry.computeBoundingSphere();
  }
});
```

After removing my zone culling, the app rendered correctly in every room. Performance on tablets? Fine. The built-in frustum culling was already hiding off-screen objects. My custom system was doing the same job but worse -- and breaking the scene in the process.

## The Numbers

| Metric | Custom Zone Culling | Built-in Frustum Culling |
|--------|-------------------|------------------------|
| Objects hidden | 2,041 (88%) | ~800-1,400 (varies by camera) |
| Black screen bugs | Constant | Zero |
| Zone transition time | 120ms (visibility toggle) | 0ms (automatic) |
| Lines of code | 47 | 0 |

## The Lesson

The instinct to optimize is good. The instinct to optimize *before understanding what the framework already provides* is how you spend a day debugging a black screen.

Three.js has been doing frustum culling since 2010. It handles edge cases I hadn't even considered: objects that span multiple zones, objects behind the camera, objects too small to matter at the current distance. My 47-line zone culler handled none of those cases.

Before you build a custom optimization:

1. **Read the docs.** Check if the framework already solves it.
2. **Measure first.** Profile before you optimize. I assumed the scene was slow because of object count, but the real bottleneck was texture loading.
3. **Log aggressively.** That `hid 2041 of 2320` log was a giant red flag. I should have questioned it immediately.

The fastest code you'll ever write is the code you don't write -- because the framework already wrote it for you.
