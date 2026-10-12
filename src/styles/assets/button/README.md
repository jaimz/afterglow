# Button icon

`add.svg` is the original export of [FAB icon, node 282:211](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=282-211).

The [FAB component, node 284:1](https://www.figma.com/design/EAs4mNS5YP0qRcKfN4HGST/Mobile?node-id=284-1), supplies the 56px diameter, translucent fill, border and effects. Its SVG export uses a 13.59px CSS background blur for Figma's 27.1828 blur radius. The button is native HTML; its icon is an unchanged asset used as a 24 × 24px CSS mask.

Rechecked on 2026-10-07: the icon export is byte-for-byte identical. The fill remains 60% opaque, with a 1px inside stroke at 19% opacity, a `0 2px 4px` black 30% drop shadow and a `0 1px 3px` cyan inner glow. The implementation overlays the stroke after the glow so the latter is not clipped to a smaller padding box.
