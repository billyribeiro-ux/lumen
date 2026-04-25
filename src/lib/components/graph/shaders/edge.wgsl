// Lumen graph — edge (link) fragment shader.
//
// Draws thin glow lines between source and target node positions,
// modulated by relation type via the hue input.

struct Camera {
  view_matrix: mat4x4<f32>,
  viewport: vec4<f32>,
};

@group(0) @binding(0) var<uniform> camera: Camera;

struct VertexInput {
  // Quad vertex offset along the segment (x = 0..1 along, y = -1..1 across)
  @location(0) offset: vec2<f32>,
  @location(1) source: vec2<f32>,
  @location(2) target: vec2<f32>,
  @location(3) hue: f32,
  @location(4) thickness: f32,
};

struct VertexOutput {
  @builtin(position) clip_pos: vec4<f32>,
  @location(0) cross_t: f32,
  @location(1) hue: f32,
};

@vertex
fn vs(input: VertexInput) -> VertexOutput {
  let dir = normalize(input.target - input.source);
  let perp = vec2<f32>(-dir.y, dir.x);
  let along = mix(input.source, input.target, input.offset.x);
  let world = along + perp * input.offset.y * input.thickness * 0.5;
  var out: VertexOutput;
  out.clip_pos = camera.view_matrix * vec4<f32>(world, 0.0, 1.0);
  out.cross_t = input.offset.y;
  out.hue = input.hue;
  return out;
}

@fragment
fn fs(in: VertexOutput) -> @location(0) vec4<f32> {
  // Soft falloff from the segment's centerline.
  let edge = 1.0 - abs(in.cross_t);
  let alpha = pow(edge, 2.5) * 0.6;
  // Cool palette for edges, hue-shifted by relation type.
  let h = 0.55 + in.hue * 0.15;
  let r = 0.4 + 0.2 * cos(h * 6.28);
  let g = 0.55 + 0.2 * cos(h * 6.28 + 2.094);
  let b = 0.85 + 0.1 * cos(h * 6.28 + 4.188);
  return vec4<f32>(r, g, b, alpha);
}
