var gl;

var timeLoc;
var time = 0;

var alphaLoc;
var alpha = 0.0;
var targetAlpha = 0.0;

var doc;

function render() {
    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    //  resize canvas if needed
    var width = gl.canvas.clientWidth / 2.0;
    var height = gl.canvas.clientHeight / 2.0;
    if (gl.canvas.width != width || gl.canvas.height != height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    
    const container = doc.getElementById('repos');
    const rect = container.getBoundingClientRect();
    
    if (rect.top < 0 && rect.bottom > gl.canvas.clientHeight) {
        targetAlpha = 0.85;
    } else {
        targetAlpha = 0.0;
    }
    
    alpha += (targetAlpha - alpha) / 20.0;
    
    if (alpha > 0.01) {
        time++;
        gl.uniform1i(timeLoc, time);
        gl.uniform1f(alphaLoc, alpha);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    
    window.requestAnimationFrame(render);
}

export function initGL(document) {
    doc = document;
    
    // initialize
    const canvas = document.getElementById('canvas');
    gl = canvas.getContext('webgl2');
    gl.clearColor(0.025, 0.065, 0.075, 1.0);

    // compile shaders and link program
    const sourceV = `#version 300 es
        void main() {
            const vec2 positions[4] = vec2[](
                vec2(-1, -1),
                vec2(+1, -1),
                vec2(-1, +1),
                vec2(+1, +1)
            );
            gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0);
        }
    `;

    const shaderV = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(shaderV, sourceV);
    gl.compileShader(shaderV);

    if (!gl.getShaderParameter(shaderV, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shaderV));
        throw new Error('Failed to compile vertex shader');
    }

    const sourceF = `#version 300 es
        precision highp float;

        out vec4 color;

        uniform int time;
        uniform float alpha;

        int chars[90] = int[] (
            // colon
            0,0,0,0,0,
            0,0,1,0,0,
            0,0,0,0,0,
            0,0,1,0,0,
            0,0,0,0,0,
            0,0,0,0,0,

            // zero
            0,0,0,0,0,
            0,1,1,1,0,
            0,1,0,1,0,
            0,1,0,1,0,
            0,1,1,1,0,
            0,0,0,0,0,

            // one
            0,0,0,0,0,
            0,0,1,0,0,
            0,0,1,0,0,
            0,0,1,0,0,
            0,0,1,0,0,
            0,0,0,0,0);

        const vec3 drawColor = vec3(0.175, 0.2, 0.2);

        // http://byteblacksmith.com/improvements-to-the-canonical-one-liner-glsl-rand-for-opengl-es-2-0/
        highp float random(vec2 co) {
            highp float a = 12.9898;
            highp float b = 78.233;
            highp float c = 43758.5453;
            highp float dt = dot(co.xy, vec2(a,b));
            highp float sn = mod(dt, 3.14);
            return fract(sin(sn) * c);
        }

        void main() {
            int xo = (int(gl_FragCoord.x) % 5);
            int yo = (int(gl_FragCoord.y) % 6);

            vec2 charCoord = vec2(floor(gl_FragCoord.x / 5.0), floor(gl_FragCoord.y / 6.0));
            charCoord.y -= float(int(time / 8));

            // if the pixel will be lit
            int solid = 0;

            int charPos = int(charCoord.x) % 10;

            //  offset into character bitmap array
            int offset = (int(random(charCoord) * 10.0) % 2 + 1) * 30;
            
            //  colon
            offset *= int(charPos != 4);
           
            solid += chars[yo * 5 + xo + offset];
            
            //  space
            solid *= int(charPos != 9);

            color = vec4(drawColor * alpha, alpha) * (float(solid) * alpha);
        }
    `;

    const shaderF = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(shaderF, sourceF);
    gl.compileShader(shaderF);

    if (!gl.getShaderParameter(shaderF, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shaderF));
        throw new Error('Failed to compile fragment shader');
    }

    const program = gl.createProgram();
    gl.attachShader(program, shaderV);
    gl.attachShader(program, shaderF);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        throw new Error('Failed to link program');
    }
    gl.useProgram(program);

    timeLoc = gl.getUniformLocation(program, "time");
    alphaLoc = gl.getUniformLocation(program, "alpha");

    //  pre-multiplied alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    
    // create VAO and draw
    const fullscreenQuadVAO = gl.createVertexArray();
    gl.bindVertexArray(fullscreenQuadVAO);

    render();
}
