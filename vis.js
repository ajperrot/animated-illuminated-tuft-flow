//Alex Perrotti
//ajperrot
//vis.js
//provides various visualization modes for weather information

//map zoom gotten from:
//https://groups.google.com/forum/#!topic/google-maps-js-api-v3/hDRO4oHVSeM

//vertex shader program
var VSHADER_SOURCE =
    "attribute vec4 a_Position;\n" +
    "attribute vec4 a_Color;\n" +
    "attribute vec2 a_TexCoord;\n" +
    "attribute vec2 a_check;\n" +
    "varying vec2 check;\n" +
    "varying vec2 v_TexCoord;\n" +
    "varying vec4 v_Color;\n" +
    "uniform mat4 u_MvpMatrix;\n" +
    "void main() {\n" +
    " gl_Position = u_MvpMatrix * a_Position;\n" +
    " v_Color = a_Color;\n" +
    " v_TexCoord = a_TexCoord;\n" +
    "check = a_check;\n" +
    " gl_PointSize = 2.0;\n" +
    "}\n";

//fragment shader program
var FSHADER_SOURCE =
    "#ifdef GL_ES\n" +
    "precision mediump float;\n" +
    "#endif\n" +
    "varying vec2 check;\n" +
    "varying vec4 v_Color;\n" +
    "varying vec2 v_TexCoord;\n" +
    "uniform sampler2D u_Sampler;\n" +
    "void main() {\n" +
    "gl_FragColor = texture2D(u_Sampler, v_TexCoord) * v_Color;\n" +
    "}\n";

//width height and depth of world
var w = 600;
var h = 600;
var d = 100;
//resolution of grid
var res = 150;
//arrow plot every _ points
var gripRes = 2;
//u-value in shepherd's algorithm
var u = 2;
//degrees to radians conversion
var rad = Math.PI / 180;
//tuft spring constant
var ks = 2;
//light direction for illumination
var light = new Float32Array([0.5, 0.5, -1]);
//view direction for illumination
var view = new Float32Array([0, 0, -1]);

//framerate
var fps = 6;
//which frame to display
var frame = 0;
//whether or not to display color
var colorOn = true;
//boolean to pause the animation
var pause = false;


//--------------------------------//
//draw the next frame of animation
//--------------------------------//
function drawFrame(gl, grid) {
    if(pause == false)
    {
        frame++;
        if(frame == grid[0].speed.length) {
            frame = 0;
        }
        redraw(gl, grid);
    }
}

//------------------------------------------------//
//clear the canvas and re-draw the active elements
//------------------------------------------------//
function redraw(gl, grid)
{
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.lineWidth(1);
    drawTuftPlot(gl, grid);
}

//-------------------------------------//
//draws a tuft every gripRes gridpoints
//-------------------------------------//
function drawTuftPlot(gl, grid)
{
    data = [];
    for(var i = 0; i <= res - gripRes; i += gripRes)
    {
        for(var j = gripRes; j <= res - gripRes; j += gripRes)
        {
            data.push(grid[i * res + j]);
        }
    }
    drawTufts(gl, data);
}

function drawTufts(gl, grid)
{
    //draw one arrow per station
    for(var i = 0; i < grid.length; i++)
    {
        //set initial tuft points and colors
        var tPointCount = 6;
        var displacement = tuftDisplacement(grid[i].speed[frame], i);
        
        var tuftPoints = new Float32Array
        ([
            0.0, 0.0, -4.0,
            displacement, 0.0, -3.0,
            displacement, 0.0, -3.0,
            displacement * 2.5, 0.0, -2.0,
            displacement * 2.5, 0.0, -2.0,
            displacement * 4.0, 0.0, -1.0,
        ]);
        var tuftColors = new Float32Array(tPointCount * 3);
        var tuftTex = new Float32Array(tPointCount * 2);
        //rotation matrix
        var rm = new Matrix4();
        rm.rotate(data[i].angle[frame], 0, 0, -1);
        //temporary points
        var v = new Vector3();
        for(var j = 0; j < tuftPoints.length; j+=3)
        {
            v.elements[0] = tuftPoints[j];
            v.elements[1] = tuftPoints[j + 1];
            v.elements[2] = tuftPoints[j + 2];
            v = rm.multiplyVector3(v);
            tuftPoints[j] = v.elements[0];
            tuftPoints[j + 1] = v.elements[1];
            tuftPoints[j + 2] = v.elements[2];
        }
        

        //color based on speed
        if(colorOn == true) {
            var heat = (data[i].speed[frame] / maxSpeed) * (255 * 3);
            var color = new Vector3([getRed(heat), getGreen(heat), getBlue(heat)]);
        } else
        {
            var color = new Vector3([1, 1, 1]);
        }
        for(var j = 0; j < tuftColors.length; j += 6)
        {
            tuftColors[j] = color.elements[0];
            tuftColors[j + 1] = color.elements[1];
            tuftColors[j + 2] = color.elements[2];
            tuftColors[j + 3] = color.elements[0];
            tuftColors[j + 4] = color.elements[1];
            tuftColors[j + 5] = color.elements[2];
        }

        //texture
        for(var j = 0; j < tPointCount - 1; j ++)// 2)
        {
            //get line tangent vector
            var pi = j * 3;
            var xdir = tuftPoints[pi + 3] - tuftPoints[pi];
            var ydir = tuftPoints[pi + 4] - tuftPoints[pi + 1];
            var zdir = tuftPoints[pi + 5] - tuftPoints[pi + 2];
            var tan = new Float32Array([xdir, ydir, zdir]);
            var mag = Math.sqrt(tan[0] * tan[0] + tan[1] * tan[1] + tan[2] * tan[2]);
            tan[0] /= mag;
            tan[1] /= mag;
            tan[2] /= mag;
            //set texture coordinates
            var lt = light[0] * tan[0] + light[1] * tan[1] + light[2] * tan[2];
            var ti = j;
            tuftTex[ti] = lt + 1;
            tuftTex[ti + 2] = lt + 1;
            var vt = view[0] * tan[0] + view[1] * tan[1] + view[2] * tan[2];
            tuftTex[ti + 1] = vt + 1;
            tuftTex[ti + 3] = vt + 1;
        }
        //reposition base of tuft to (lon, lat) of station
        for(var j = 0; j < tuftPoints.length; j+=3)
        {
            tuftPoints[j] += data[i].lon;
            tuftPoints[j + 1] += data[i].lat;
        }
        //draw one arrow
        initArrayBuffer(gl, "a_Position", 3, gl.FLOAT);
        gl.bufferData(gl.ARRAY_BUFFER, tuftPoints, gl.STATIC_DRAW);
        initArrayBuffer(gl, "a_Color", 3, gl.FLOAT);
        gl.bufferData(gl.ARRAY_BUFFER, tuftColors, gl.STATIC_DRAW);
        initArrayBuffer(gl, 'a_TexCoord', 2, gl.FLOAT);
        gl.bufferData(gl.ARRAY_BUFFER, tuftTex, gl.STATIC_DRAW);
        gl.drawArrays(gl.LINE_STRIP, 0, tPointCount);
        gl.drawArrays(gl.POINTS, 0, 1);
    }
}

//-----------------------------------------------------//
//returns the tuft displacement created by a wind speed
//-----------------------------------------------------//
function tuftDisplacement(windSpeed, index)
{
    //air density estimation in kg/m^3
    //taken from: http://www.ajackson.org/wview_files/
    //dampening force not factored in due to framerate
    var airDensity = 1.246;
    //generalizing surface area as 1 m^2
    var windForce = airDensity * windSpeed * 1;
    //force = windForce + springForce
    var netForce = 0;
    var springForce = netForce - windForce;
    var restLength = 0;
    var dist = (springForce / ks) + restLength;
    return dist * -1;

}

//--------------//
//main
//--------------//
function main()
{
    //get canvas element
    var canvas = document.getElementById("webgl");

    //get input elements
    var colorToggle = document.getElementById("colorToggle");
    var pauseToggle = document.getElementById("pauseToggle");
    
    //get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    //initialize shaders
    initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE);
    
    //set mvp matrix
    var u_MvpMatrix = gl.getUniformLocation(gl.program, "u_MvpMatrix");
    var MvpMatrix = new Matrix4();
    MvpMatrix.setOrtho(0, w, h, 0, 0, d);
    //pass the model view projection matrix to the variable u_MvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, MvpMatrix.elements);

    //initialize vertex buffers
    initIndexBuffer(gl);
    //initialize texture (url to get around CORS)
    //bright: https://i.imgur.com/pyKete4.jpg
    //normal: https://i.imgur.com/cmqmng3.jpg
    initTexture(gl, "bright.jpg");

    //set line width
    gl.lineWidth(1);
    //set canvas clear color
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    //gl.clearStencil(1);
    gl.clearDepth(1);
    //enable depth test
    gl.enable(gl.DEPTH_TEST);
    //clear canvas
    gl.clear(gl.COLOR_BUFFER_BIT);

    //initialize the grid
    var grid = initGrid(stations);

    //set input event handlers
    colorToggle.onmousedown = function(){colorOn = !colorOn};
    pauseToggle.onmousedown = function(){pause = !pause};

    //set interval event handler
    setInterval(function(){drawFrame(gl, grid)}, 1000 / fps);
}

//----------------------------------------------------------------//
//use values from data.js to create a 100x100 grid of wind vectors
//----------------------------------------------------------------//
function initGrid(stations)
{
    //longitude/latitude limits for mapping
    var minLon = -96;
    var maxLon = -94;
    var minLat = 28;
    var maxLat = 30;
    var lonRange = maxLon - minLon;
    var latRange = maxLat - minLat;

    //get new lat/lon values to fit to world coordinates
    for(var i = 0; i < stations.length; i++)
    {
        newLon = ((stations[i].lon - minLon) / lonRange) * w;
        newLat = ((((stations[i].lat - minLat) / latRange) * -1) + 1) * h;
        stations[i].repos(newLat, newLon);
    }
    //fill grid via shepherds interpolation
    var grid = shepherds(stations);
    return grid;
}

//-----------------------------------------------------//
//returns a square grid of Mets,
//based on a shepherds interpolation of a station array
//-----------------------------------------------------//
function shepherds(scatter)
{
    var grid = [];
    for(var i = 0; i < res; i++)
    {
        for(var j = 0; j < res; j++)
        {
            var x = (w / (res - 1)) * j;
            var y = (h / (res - 1)) * i;
            //numerator
            var vxSum = [];
            var vySum = [];
            for(var l = 0; l < scatter[0].speed.length; l++)
            {
                vxSum.push(0);
                vySum.push(0);
            }
            //denominator
            var distSum = 0;
            var set = false;
            //fill numerator and denominator for interpolation
            for(var k = 0; k < scatter.length; k++)
            {
                //if this point is already in scatter
                if(scatter[k].lon == x && scatter[k].lat == y)
                {
                    grid.push(new Met(y, x, scatter[k].speed, scatter[k].angle));
                    set = true;
                    break;
                }
                var xDist = Math.pow(scatter[k].lon - x, u);
                var yDist = Math.pow(scatter[k].lat - y, u);
                var dist = Math.sqrt(Math.pow(xDist, 2) + Math.pow(yDist, 2));
                for(var l = 0; l < scatter[k].speed.length; l++)
                {
                    vxSum[l] += (scatter[k].speed[l] * Math.cos(scatter[k].angle[l] * rad)) / dist;
                    vySum[l] += (scatter[k].speed[l] * Math.sin(scatter[k].angle[l] * rad)) / dist;
                }
                distSum += 1 / dist;
            }
            if(set == false)
            {
                var speed = [];
                var angle = [];
                for(var l = 0; l < scatter[0].speed.length; l++)
                {
                    var vx = vxSum[l] /= distSum;
                    var vy = vySum[l] /= distSum;
                    speed[l] = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));
                    angle[l] = Math.atan2(vy, vx) / rad;
                    //add new Met to grid
                }
                grid.push(new Met(y, x, speed, angle));
            }
        }
    }
    return grid;
}

function getRed(heat)
{
    var r = heat - 255;
    if(r > 255)
    {
        r = 255;
    }else if(r < 0)
    {
        r = 0;
    }
    return r / 255;
}

function getGreen(heat)
{
    var g;
    if(heat > 255 * 2)
    {
        g = 255 - (heat - (255 * 2));
    }else
    {
        g = heat;
    }
    if(g > 255)
    {
        g = 255;
    }
    return g / 255;
}

function getBlue(heat)
{
    var b = (255 * 2) - heat;
    if(b > 255)
    {
        b = 255;
    }else if(b < 0)
    {
        b = 0;
    }
    return b / 255;
}