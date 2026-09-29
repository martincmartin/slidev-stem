# Source notes

Consulted on 2026-09-27. These notes preserve the facts used in the plan.
They are short paraphrases, not copies of the linked documents.
Library documentation establishes an API or a feature. It does not establish performance for this watch.

| Source                                                                                                                                           | Fact used                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [SVG 2 rendering model](https://www.w3.org/TR/SVG2/render.html#ObjectAndGroupOpacityProperties)                                                  | SVG paints in order. Object opacity and group opacity apply after composition. Fill opacity and stroke opacity apply to individual paint operations.              |
| [SVG path data](https://www.w3.org/TR/SVG2/paths.html#PathData)                                                                                  | Smooth path interpolation needs matching command structure. Corresponding path parameters interpolate separately.                                                 |
| [SVG animation interfaces](https://svgwg.org/specs/animations/#InterfaceSVGAnimationElement)                                                     | Animation elements expose start time, container time, simple duration, and methods to begin or end an interval. These methods do not report a geometric extreme.  |
| [SVG root interface](https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement)                                                             | An inline SVG root can pause, resume, read its time, and seek. Pause applies to the root's animation timeline.                                                    |
| [Web Animations current time](https://developer.mozilla.org/en-US/docs/Web/API/Animation/currentTime)                                            | A Web Animations animation exposes a readable and writable current time. This API is separate from SMIL.                                                          |
| [Web Animations computed timing](https://developer.mozilla.org/en-US/docs/Web/API/AnimationEffect/getComputedTiming)                             | Computed timing includes progress and iteration information.                                                                                                      |
| [HTML Canvas specification](https://html.spec.whatwg.org/multipage/canvas.html)                                                                  | Canvas defines paths, clipping, composition, and transferable OffscreenCanvas objects. A canvas resize resets its bitmap and drawing state.                       |
| [Path2D constructor](https://developer.mozilla.org/en-US/docs/Web/API/Path2D/Path2D)                                                             | The constructor accepts SVG path data. Path2D is available in workers.                                                                                            |
| [DOMParser](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser)                                                                          | DOMParser parses markup into a document. It does not implement SVG drawing or animation.                                                                          |
| [Worker animation frames](https://developer.mozilla.org/en-US/docs/Web/API/DedicatedWorkerGlobalScope/requestAnimationFrame)                     | Dedicated workers can request animation frames. The worker needs an associated owner window.                                                                      |
| [Canvas transfer](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/transferControlToOffscreen)                                 | Transfer fails after a rendering context has been obtained. Transfer also fails if control was already transferred.                                               |
| [Canvg API](https://canvg.js.org/api/classes/Canvg)                                                                                              | Canvg renders SVG to Canvas. Its public API has start, stop, and first-frame rendering methods.                                                                   |
| [Canvg worker preset](https://canvg.js.org/api/namespaces/presets)                                                                               | Canvg offers an OffscreenCanvas preset with parser and image-loading configuration.                                                                               |
| [SVG.js](https://svgjs.dev/docs/3.2/)                                                                                                            | SVG.js creates and animates SVG DOM content. It is not an SVG-to-Canvas renderer.                                                                                 |
| [Paper.js Path](https://paperjs.org/reference/path/)                                                                                             | Paper.js has editable paths and SVG import/export.                                                                                                                |
| [Konva overview](https://konvajs.org/docs/overview.html)                                                                                         | Konva has stages, layers, groups, shapes, and event detection. Layers use scene and hit canvases.                                                                 |
| [Konva group transparency](https://new.konvajs.org/docs/sandbox/Transparent_Group.html)                                                          | Ordinary group opacity reaches child shapes. Caching the group gives composition as one image.                                                                    |
| [PixiJS 8.16 release, 2026-02-04](https://pixijs.com/blog/8.16.0)                                                                                | This release added an experimental Canvas renderer. It did not support every GPU-renderer feature.                                                                |
| [PixiJS rendering guide](https://pixijs.com/8.x/guides/components/renderers), [development API](https://pixijs.download/dev/docs/rendering.html) | The guide still says Canvas is forthcoming. The development API lists Canvas support. The dated release note resolves this discrepancy.                           |
| [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/typescript-from-scratch.html)                                                 | TypeScript checks types and produces JavaScript. Type annotations do not validate incoming JSON at runtime.                                                       |
| [Rust canvas example](https://rustwasm.github.io/docs/wasm-bindgen/examples/2d-canvas.html)                                                      | Rust can call the browser's Canvas API through wasm-bindgen and web-sys. This still uses browser drawing operations.                                              |
| [Three.js orthographic camera](https://threejs.org/docs/pages/OrthographicCamera.html)                                                           | Three.js supports an orthographic camera.                                                                                                                         |
| [Three.js transparency](https://threejs.org/manual/pages/transparency.html)                                                                      | A depth buffer resolves opaque surfaces. Transparent surfaces need additional ordering work.                                                                      |
| [Sellita SW210-1 technical document, revision 05, 2024-09-02](https://www.sellita.ch/scripts/calibres/images/DocTec_SW210-1_5.pdf)               | Printed pages 5–7 list the movement parts. Pages 10–15 show assembly groups. The list includes motion works, keyless works, balance fittings, and calendar parts. |

The watch inventory in PLAN.md uses Sellita to check coverage and terminology.
Its proposed geometry is our design assessment, not a claim about Sellita's exact part dimensions.
The talk's drawing is a simplified mechanism, not a reconstruction of this calibre.

The local browser probes independently check SVG seeking, animation handoff,
worker drawing, Path2D cloning, and group opacity. See [browser_probe.json](evidence/browser_probe.json).
The probes use Chromium 153.0.8010.12 and Firefox 155.0 in headless mode.
They do not measure presentation smoothness or verify Firefox 157.

## SVG input and supplemental data

Consulted on 2026-09-27 for the revised format recommendation in PLAN.md, section 4.

| Source                                                                                        | Fact used                                                                                            |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| [SVG metadata](https://www.w3.org/TR/SVG2/struct.html#MetadataElement)                        | Metadata is not rendered. SVG recommends foreign-namespace elements for its contents.                |
| [SVG custom data attributes](https://www.w3.org/TR/SVG2/struct.html#DataAttributes)           | SVG elements support `data-*` attributes.                                                            |
| [SVG foreign namespaces](https://www.w3.org/TR/SVG2/struct.html#ForeignNamespaces)            | XML and HTML parsers handle custom namespace prefixes differently.                                   |
| [Element.getAttribute](https://developer.mozilla.org/en-US/docs/Web/API/Element/getAttribute) | Attribute access returns a string or null. Numeric attributes still need conversion and validation.  |
| [XML syntax](https://www.w3.org/TR/xml/#syntax)                                               | XML text and attributes have escaping rules. A JSON payload must satisfy the surrounding XML syntax. |
| [SVGO removeMetadata](https://svgo.dev/docs/plugins/removeMetadata/)                          | An optimizer can remove metadata explicitly. Required application data needs preservation checks.    |

The packaging rankings are design judgments, based on the current requirements and measured SVG size.
They are not loading benchmarks. The existing browser probe does not test the proposed metadata payload.
