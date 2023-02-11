var gl;

var program = new Array(2);
var alpha = new Array(2);
    
var time = 0;

var doc;
var requestId;
var navBarHeight;

function renderEffect(divName, shaderIndex) {
    var container = doc.getElementById(divName);
    var rect = container.getBoundingClientRect();

    var targetAlpha = 0.0;
    if (rect.top <= (navBarHeight * 2) && rect.bottom >= gl.canvas.clientHeight) {
        targetAlpha = 1.0;
    }
    
    alpha[shaderIndex] += (targetAlpha - alpha[shaderIndex]) / 20.0;
    
    if (alpha[shaderIndex] > 0.01) {
        time++;

        gl.useProgram(program[shaderIndex]);
        var timeLoc = gl.getUniformLocation(program[shaderIndex], "time");
        var alphaLoc = gl.getUniformLocation(program[shaderIndex], "alpha");

        gl.uniform1i(timeLoc, time);
        gl.uniform1f(alphaLoc, alpha[shaderIndex]);
        
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}

function render() {
    const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    //  resize canvas if needed
    var width = gl.canvas.clientWidth / 2.0;
    var height = gl.canvas.clientHeight / 2.0;
    if (gl.canvas.width != width || gl.canvas.height != height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.useProgram(program[0]);
        gl.uniform2f(gl.getUniformLocation(program[0], "resolution"), width, height);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);

    renderEffect('hello-container', 0);
    renderEffect('repos', 1);
    
    requestId = window.requestAnimationFrame(render, canvas);
}

function handleContextLost(event) {
    initGL(doc);
    event.preventDefault();
    cancelRequestAnimationFrame(requestId);
}

function createShaderProgram(vertexSource, fragmentSource) {
    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(vertexShader));
        throw new Error('Failed to compile vertex shader');
    }
    
    var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(fragmentShader));
        throw new Error('Failed to compile fragment shader');
    }

    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        throw new Error('Failed to link program');
    }
    
    return program;
}

export function initGL(document) {
    doc = document;
    navBarHeight = document.querySelector('.navbar').offsetHeight;
    
    // initialize
    const canvas = document.getElementById('canvas');
    gl = canvas.getContext('webgl2');
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    gl.clearColor(0.025, 0.065, 0.075, 1.0);

    // compile shaders and link program
    const vertexSource = `#version 300 es
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

    const fragmentSource1 = `#version 300 es
        precision highp float;

        out vec4 color;

        uniform int time;
        uniform float alpha;
        uniform vec2 resolution;

        const vec3 drawColor = vec3(0.175, 0.2, 0.2);

        struct ray {
            vec3 pos;
            vec3 dir;
        };
        
        ray createCameraRay(vec2 uv, vec3 camPos, vec3 lookAt, vec3 up, float zoom){
            vec3 f = normalize(lookAt - camPos);
            vec3 r = cross(up, f);
            vec3 u = cross(f, r);
            vec3 c = camPos + f * zoom;
            vec3 i = c + uv.x * r + uv.y * u;
            vec3 dir = i - camPos;
            return ray(camPos, dir);
        }

        float distanceFunction(vec3 p) {
            p = mod(p, 8.0) - 4.0;
            vec3 b = vec3(1.5, 3, 1.5) * 0.7; // box size
            vec3 d = abs(p) - b;
            return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
        }
         
        vec3 getNormal(vec3 p) {
            const float d = 0.0001;
            return normalize(vec3(
                distanceFunction(p + vec3(d, 0.0, 0.0)) - distanceFunction(p + vec3(-d, 0.0, 0.0)),
                distanceFunction(p + vec3(0.0, d, 0.0)) - distanceFunction(p + vec3(0.0, -d, 0.0)),
                distanceFunction(p + vec3(0.0, 0.0, d)) - distanceFunction(p + vec3(0.0, 0.0, -d))
            ));
        }

        void main() {
            //  uv setup
            vec2 uv = (gl_FragCoord.xy * 2.0 - resolution) / resolution;
            if (resolution.y > resolution.x) {
                uv.x *= (resolution.x / resolution.y);
            } else {
                uv.y *= (resolution.y / resolution.x);
            }
            
            //  camera setup
            float fTime = float(time + 480) / 60.0;

            float speed = 60.0;
            float dist = 100.0;
            vec3 camPos = vec3(cos(fTime / speed) * dist, -sin(fTime / speed) * dist, 0.0);

            speed = 10.0;
            dist = 200.0;
            vec3 lookAt = vec3(cos(fTime / speed) * dist, 0.0, sin(fTime / speed) * dist);
            vec3 up = vec3(0.0, 1.0, 0.0); //vec3(cos(fTime / speed), sin(fTime / speed), 1.0);
            float zoom = 1.0;
            
            ray camRay = createCameraRay(uv, camPos, lookAt, up, zoom);
            
            // march!
            float totalDistance = 0.0;
            float distanceToScene;
            vec3 posOnRay = camPos;

            int maxIterations = 64;
            for(int i = 0; i < maxIterations; i++) {
                distanceToScene = distanceFunction(posOnRay);
                totalDistance += distanceToScene;
                posOnRay = camPos + totalDistance * camRay.dir;
            }

            float epsilon = 0.0001;
            if (abs(distanceToScene) > epsilon) {
                discard;
            }

            // light position
            speed = 20.0;
            dist = 150.0;
            vec3 lightPos = vec3(0.0, -cos(fTime / speed) * dist, sin(fTime / speed) * dist);

            // phong shading
            vec3 normal = getNormal(posOnRay);
            float diffuse = dot(normal, normalize(lightPos - posOnRay));
            
            diffuse *= alpha;
            color = vec4(drawColor * diffuse, diffuse);
        }
    `;

    const fragmentSource2 = `#version 300 es
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

            float a = alpha * 0.85;
            color = vec4(drawColor * a, a) * (float(solid) * a);
        }
    `;

    program[0] = createShaderProgram(vertexSource, fragmentSource1);
    program[1] = createShaderProgram(vertexSource, fragmentSource2);
    
    alpha[0] = 0.0;
    alpha[1] = 0.0;
    
    //  pre-multiplied alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    
    // create VAO and draw
    const fullscreenQuadVAO = gl.createVertexArray();
    gl.bindVertexArray(fullscreenQuadVAO);

    render();
}
