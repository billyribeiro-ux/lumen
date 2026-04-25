// Lumen graph — node fragment shader.
//
// Produces a soft glow disk per node with a thin ring at the edge.
// The instance buffer carries (x, y, radius, hue) per node.

struct Camera {
  view_matrix: mat4x4<f32>,
  // (canvas_width, canvas_height, dpr, time_seconds)
  viewport: vec4<f32>,
};

@group(0) @binding(0) var<uniform> camera: Camera;

struct VertexInput {
  @location(0) corner: vec2<f32>,         // unit-quad corner in [-1,1]
  @location(1) instance_pos: vec2<f32>,   // node center in graph space
  @location(2) instance_radius: f32,
  @location(3) instance_hue: f32,         // 0..1
};

struct VertexOutput {
  @builtin(position) clip_pos: vec4<f32>,
  @location(0) local: vec2<f32>,
  @location(1) hue: f32,
};

@vertex
fn vs(input: VertexInput) -> VertexOutput {
  var out: VertexOutput;
  let world = vec2<f32>(
    input.instance_pos.x + input.corner.x * input.instance_radius,
    input.instance_pos.y + input.corner.y * input.instance_radius,
  );
  out.clip_pos = camera.view_matrix * vec4<f32>(world, 0.0, 1.0);
  out.local = input.corner;
  out.hue = input.instance_hue;
  return out;
}

// Simple HSL → RGB; OKLCH would be ideal but the GPU cost is overkill
// for the disk renderer. We sample on the CPU via OKLCH and pass hue
// already premultiplied to a perceptual scale; the shader just shapes
// the alpha falloff.
fn hsl_to_rgb(h: f32, s: f32, l: f32) -> vec3<f32> {
  let c = (1.0 - abs(2.0 * l - 1.0)) * s;
  let h6 = h * 6.0;
  let x = c * (1.0 - abs((h6 - floor(h6 / 2.0) * 2.0) - 1.0));
  let m = l - c * 0.5;

  var r = 0.0;
  var g = 0.0;
  var b = 0.0;
  if      (h6 < 1.0) { r = c; g = x; b = 0.0; }
  else if (h6 < 2.0) { r = x; g = c; b = 0.0; }
  else if (h6 < 3.0) { r = 0.0; g = c; b = x; }
  else if (h6 < 4.0) { r = 0.0; g = x; b = c; }
  else if (h6 < 5.0) { r = x; g = 0.0; b = c; }
  else               { r = c; g = 0.0; b = x; }

  return vec3<f32>(r + m, g + m, b + m);
}

@fragment
fn fs(in: VertexOutput) -> @location(0) vec4<f32> {
  let d = length(in.local);
  if (d > 1.0) {
    discard;
  }

  // Soft inner disk + outer glow.
  let core = smoothstep(1.0, 0.55, d);
  let glow = smoothstep(1.0, 0.0, d) * 0.35;

  let pulse = 0.5 + 0.5 * sin(camera.viewport.w * 1.6 + in.hue * 6.28);
  let saturation = mix(0.55, 0.85, pulse);
  let lightness = 0.62;

  let color = hsl_to_rgb(in.hue, saturation, lightness);
  let alpha = clamp(core + glow, 0.0, 1.0);
  return vec4<f32>(color, alpha);
}
