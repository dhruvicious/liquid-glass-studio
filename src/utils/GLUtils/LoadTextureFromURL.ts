export function loadTextureFromURL(gl: WebGL2RenderingContext, url: string): Promise<{ texture: WebGLTexture, ratio: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = ""; // 可根据需要设为 'anonymous'

    image.onload = () => {
      const texture = gl.createTexture();
      if (!texture) return reject("Failed to create texture");

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D, 0, gl.RGBA,
        gl.RGBA, gl.UNSIGNED_BYTE, image
      );
      gl.generateMipmap(gl.TEXTURE_2D);

      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      resolve({ texture, ratio: image.naturalWidth / image.naturalHeight });
    };

    image.onerror = reject;
    image.src = url;
  });
}