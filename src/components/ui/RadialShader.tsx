import { useEffect, useRef } from 'react';

const vertexSource = `#version 300 es
in vec4 position;
void main() {
  gl_Position = position;
}`;

const fragmentSource = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform float time;
uniform vec2 resolution;

void main() {
  vec2 uv = (gl_FragCoord.xy - resolution * 0.5) / min(resolution.x, resolution.y);
  float t = time * 0.4;

  float r = length(uv);
  float a = atan(uv.y, uv.x);

  float ring = sin(r * 8.0 - t * 2.0) * 0.5 + 0.5;
  ring *= exp(-r * 2.5);

  float swirl = sin(a * 3.0 + t + r * 4.0) * 0.5 + 0.5;
  float inner = exp(-r * 4.0) * (sin(t * 3.0) * 0.5 + 0.5);

  vec3 violet = vec3(0.486, 0.227, 0.929);
  vec3 indigo = vec3(0.310, 0.275, 0.898);
  vec3 deep   = vec3(0.039, 0.039, 0.078);

  vec3 col = mix(deep, violet, ring * swirl);
  col += indigo * inner * 0.6;
  col = tanh(col * 1.5);

  fragColor = vec4(col, 1.0);
}`;

export default function RadialShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) return;
    glRef.current = gl;

    function compileShader(type: number, source: string): WebGLShader | null {
      const shader = gl!.createShader(type);
      if (!shader) return null;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    }

    const vert = compileShader(gl.VERTEX_SHADER, vertexSource);
    const frag = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vert || !frag) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;
    gl.useProgram(program);

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const resLoc = gl.getUniformLocation(program, 'resolution');
    const timeLoc = gl.getUniformLocation(program, 'time');

    function resize() {
      if (!canvas || !gl) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(resLoc, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener('resize', resize);

    function render() {
      if (!gl || !program) return;
      const t = (Date.now() - startRef.current) / 1000;
      gl.uniform1f(timeLoc, t);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
}
