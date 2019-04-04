//Alex Perrotti
//ajperrot
//glHelper.js
//a series of general helper functions for handling the minutia of WebGL

//---------------------------------------------------//
//initialize index buffer (no data written to buffer)
//---------------------------------------------------//
function initIndexBuffer(gl)
{
    //creates index buffer object
    var indexBuffer = gl.createBuffer();
    initArrayBuffer (gl, 'a_Position', 3, gl.FLOAT);
    //bind index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
}

//---------------------------------------//
//initialize spectrum texture for mapping
//---------------------------------------//
function initTexture(gl, picName)
{
    var texture = gl.createTexture();
    var u_Sampler = gl.getUniformLocation(gl.program, 'u_Sampler');
    var image = new Image();
    //image.crossOrigin = "";
    image.onload = function(){ loadTexture(gl, texture, u_Sampler, image); };
    image.src = picName;
}

//--------------------------------------------------//
//load in new texture
//--------------------------------------------------//
function loadTexture(gl, texture, u_Sampler, image)
{

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler, 0);
    /*
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    
    */
    /*
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    gl.uniform1i(u_Sampler, 0);
    //redrawAll(gl);
    */
}

//--------------------------------------------------//
//initialize one buffer for a specific purpose
//--------------------------------------------------//
function initArrayBuffer (gl, attribute, num, type)
{
    // Create a buffer object
    var buffer = gl.createBuffer();
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment of the buffer object to the attribute variable
    gl.enableVertexAttribArray(a_attribute);
    return true;
}